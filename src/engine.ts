/**
 * HoverSense Core Engine
 *
 * Framework-agnostic pointerless interaction engine for touch interfaces.
 * Coordinates pointer gestures, scroll tracking, safe zone evaluation,
 * and channel arbitration to bring spatial hover to any website or app.
 */

import { DEFAULT_CONFIG } from './defaults';
import {
  clamp,
  smooth,
  lerp,
  sampleZones,
  computeIntent,
  isTap,
  resolveScreen,
  getHitUnderPoint,
  arbitrate,
} from './math';
import { CssVariableBinder, applyTouchHygiene } from './css';
import { HoverSenseFeedback } from './feedback';
import type {
  Rect,
  MeasuredItem,
  HoverSenseConfig,
  HoverSenseOptions,
  ContainerOptions,
  GestureState,
  TouchLatch,
  HoverHit,
  HoverSenseState,
  HoverCallback,
  StateCallback,
  GestureCallback,
  IntentCallback,
} from './types';

type ElementTarget = HTMLElement | SVGElement | (() => Rect) | Rect;

interface RegisteredTarget {
  target: ElementTarget;
  data?: Record<string, unknown>;
}

export class HoverSense {
  private config: HoverSenseConfig;
  private stageElement: HTMLElement | Window | null = null;
  private registry = new Map<string, RegisteredTarget>();

  private gesture: GestureState = {
    phase: 'idle',
    startX: 0,
    startY: 0,
    x: 0,
    y: 0,
    startTime: 0,
    lastTime: 0,
    endTime: null,
    zoneWeight: 1,
    zoneId: null,
    scrollLocked: false,
    down: false,
  };

  private latch: TouchLatch | null = null;
  private scrollAtLatch = 0;
  private isRunning = false;
  private rafId = 0;
  private lastStateKey = '';

  private cssBinder: CssVariableBinder | null = null;
  private feedbackOverlay: HoverSenseFeedback | null = null;
  private forceCleanup = false;
  private itemDwellTimers = new Map<string, number>();

  private currentState: HoverSenseState = {
    hits: [],
    hitsById: new Map(),
    debug: {
      phase: 'idle',
      intent: 0,
      authority: 0,
      pointer: { x: 0, y: 0 },
      zoneWeight: 1,
      zoneId: null,
      scrollLocked: false,
      holdMs: 320,
      elapsed: 0,
      latch: null,
      scrollY: 0,
      takeover: 0,
      isCleanup: false,
      dwellActiveId: null,
      dwellMet: true,
    },
    isCleanup: false,
  };

  // Event Listeners
  private hoverListeners = new Set<HoverCallback>();
  private stateListeners = new Set<StateCallback>();
  private gestureListeners = new Set<GestureCallback>();
  private intentListeners = new Set<IntentCallback>();

  // Bound DOM Handlers
  private handlePointerDown: (e: PointerEvent) => void;
  private handlePointerMove: (e: PointerEvent) => void;
  private handlePointerUp: (e: PointerEvent) => void;
  private handlePointerCancel: (e: PointerEvent) => void;

  constructor(options?: HoverSenseOptions, stage?: HTMLElement | Window | string) {
    this.config = this.mergeOptions(DEFAULT_CONFIG, options);

    if (options?.bindCssVariables) {
      this.cssBinder = new CssVariableBinder();
    }

    this.handlePointerDown = this.onPointerDown.bind(this);
    this.handlePointerMove = this.onPointerMove.bind(this);
    this.handlePointerUp = this.onPointerUp.bind(this);
    this.handlePointerCancel = this.onPointerCancel.bind(this);

    if (typeof window !== 'undefined') {
      if (typeof stage === 'string') {
        const el = document.querySelector(stage);
        this.stageElement = (el as HTMLElement) || window;
      } else if (stage) {
        this.stageElement = stage;
      } else {
        this.stageElement = window;
      }
      this.attachEvents();

      if (options?.feedback) {
        this.feedbackOverlay = new HoverSenseFeedback();
        this.feedbackOverlay.attach(this);
      }

      this.start();
    }
  }

  /**
   * Returns the visual feedback overlay instance if active.
   */
  public getFeedback(): HoverSenseFeedback | null {
    return this.feedbackOverlay;
  }


  /**
   * Deeply merges user options with current configuration.
   */
  private mergeOptions(base: HoverSenseConfig, incoming?: HoverSenseOptions): HoverSenseConfig {
    if (!incoming) return { ...base };
    return {
      screen: { ...base.screen, ...(incoming.screen || {}) },
      touch: { ...base.touch, ...(incoming.touch || {}) },
      arbitration: { ...base.arbitration, ...(incoming.arbitration || {}) },
      safeZones: incoming.safeZones ? [...incoming.safeZones] : [...base.safeZones],
      modes: { ...base.modes, ...(incoming.modes || {}) },
    };
  }

  /**
   * Updates configuration dynamically at runtime.
   */
  public updateConfig(newOptions: HoverSenseOptions): this {
    this.config = this.mergeOptions(this.config, newOptions);
    if (!this.config.modes.touch) {
      this.latch = null;
    }
    return this;
  }

  /**
   * Gets current configuration.
   */
  public getConfig(): HoverSenseConfig {
    return { ...this.config };
  }

  /**
   * Registers a target element or dynamic bounding box supplier.
   *
   * @param id Unique identifier.
   * @param target DOM element, callback returning bounding Rect, or static Rect.
   * @param data Optional custom metadata attached to this item.
   */
  public register(id: string, target: ElementTarget, data?: Record<string, unknown>): this {
    this.registry.set(id, { target, data });
    return this;
  }

  /**
   * Unregisters a target item.
   */
  public unregister(id: string): this {
    this.registry.delete(id);
    if (this.latch && this.latch.id === id) {
      this.latch = null;
    }
    return this;
  }

  /**
   * Clears all registered targets.
   */
  public clear(): this {
    this.registry.clear();
    this.latch = null;
    this.itemDwellTimers.clear();
    return this;
  }

  /**
   * Sets the gesture stage container element.
   */
  public setStage(stage: HTMLElement | Window | string): this {
    this.detachEvents();
    if (typeof stage === 'string') {
      const el = document.querySelector(stage);
      this.stageElement = (el as HTMLElement) || window;
    } else {
      this.stageElement = stage;
    }
    this.attachEvents();
    return this;
  }

  /**
   * Subscribes to hover changes.
   */
  public onHover(callback: HoverCallback): () => void {
    this.hoverListeners.add(callback);
    return () => this.hoverListeners.delete(callback);
  }

  /**
   * Subscribes to comprehensive state updates.
   */
  public onState(callback: StateCallback): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  /**
   * Subscribes to gesture state transitions.
   */
  public onGesture(callback: GestureCallback): () => void {
    this.gestureListeners.add(callback);
    return () => this.gestureListeners.delete(callback);
  }

  /**
   * Subscribes to real-time intent accumulation (0.0 to 1.0) for progress rings.
   */
  public onIntent(callback: IntentCallback): () => void {
    this.intentListeners.add(callback);
    return () => this.intentListeners.delete(callback);
  }

  /**
   * Returns current snapshot of hover and debug state.
   */
  public getState(): HoverSenseState {
    return this.currentState;
  }

  /**
   * Starts the internal measurement and arbitration loop.
   */
  public start(): this {
    if (this.isRunning) return this;
    this.isRunning = true;
    const tick = () => {
      if (!this.isRunning) return;
      this.evaluateFrame();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
    return this;
  }

  /**
   * Pauses the engine frame loop.
   */
  public stop(): this {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    return this;
  }

  /**
   * Destroys the engine, detaching all event listeners and clearing state.
   */
  public destroy(): void {
    this.stop();
    this.detachEvents();
    if (this.cssBinder) {
      this.cssBinder.clear();
      this.cssBinder = null;
    }
    if (this.feedbackOverlay) {
      this.feedbackOverlay.destroy();
      this.feedbackOverlay = null;
    }
    this.registry.clear();
    this.itemDwellTimers.clear();
    this.hoverListeners.clear();
    this.stateListeners.clear();
    this.gestureListeners.clear();
    this.intentListeners.clear();
  }

  /**
   * Measures all registered items and extracts viewport-relative Rects.
   */
  private measureItems(): MeasuredItem[] {
    const items: MeasuredItem[] = [];
    for (const [id, entry] of this.registry.entries()) {
      const { target, data } = entry;
      let rect: Rect | null = null;

      if (typeof target === 'function') {
        rect = target();
      } else if (target && 'getBoundingClientRect' in target) {
        const domRect = (target as HTMLElement).getBoundingClientRect();
        rect = {
          left: domRect.left,
          right: domRect.right,
          top: domRect.top,
          bottom: domRect.bottom,
          width: domRect.width,
          height: domRect.height,
        };
      } else if (target && typeof target === 'object' && 'left' in target) {
        rect = target as Rect;
      }

      if (rect) {
        items.push({ id, rect, data });
      }
    }
    return items;
  }

  /**
   * Evaluates a single frame: intent calculation, latching, arbitration, and notification.
   */
  private evaluateFrame(): void {
    if (typeof window === 'undefined') return;

    const now = performance.now();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const g = this.gesture;
    const cfg = this.config;

    // 1. Calculate intent
    const intent = (g.phase === 'probing' || g.phase === 'engaged')
      ? computeIntent(g, cfg.touch, now)
      : 0;

    this.intentListeners.forEach(cb => cb(intent, g));

    // 2. Intent engagement and latch lock
    if (g.phase === 'probing' && intent >= cfg.touch.engageAt) {
      g.phase = 'engaged';
      const items = this.measureItems();
      const hitId = getHitUnderPoint({ x: g.startX, y: g.startY }, items, cfg.touch);
      if (hitId) {
        this.latch = { id: hitId, x: g.startX, y: g.startY };
        this.scrollAtLatch = window.scrollY;
      } else {
        // Touched in empty space: deselect / cleanup
        const wasLatched = Boolean(this.latch);
        this.latch = null;
        if (wasLatched || cfg.arbitration.emptySpaceCleanup !== false) {
          this.forceCleanup = true;
        }
      }
      this.gestureListeners.forEach(cb => cb(g));
    }

    if (g.phase === 'engaged' && g.down) {
      this.scrollAtLatch = window.scrollY;
    }

    // 3. Compute Touch Authority
    let authority = 0;
    if (this.latch && cfg.modes.touch) {
      if (cfg.arbitration.releaseMode === 'scroll') {
        const d = Math.abs(window.scrollY - this.scrollAtLatch);
        const a = 1 - smooth((d - cfg.arbitration.takeoverStartPx) /
          Math.max(1, cfg.arbitration.takeoverFullPx - cfg.arbitration.takeoverStartPx));
        authority = clamp(a, 0, 1);
      } else if (cfg.arbitration.releaseMode === 'off-screen') {
        if (this.latch.id && this.registry.has(this.latch.id)) {
          const entry = this.registry.get(this.latch.id)!;
          let r: Rect | null = null;
          if (typeof entry.target === 'function') r = entry.target();
          else if ('getBoundingClientRect' in (entry.target as HTMLElement)) {
            const domRect = (entry.target as HTMLElement).getBoundingClientRect();
            r = { left: domRect.left, right: domRect.right, top: domRect.top, bottom: domRect.bottom, width: domRect.width, height: domRect.height };
          }
          if (r && (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw)) {
            authority = 0;
          } else {
            authority = 1;
          }
        } else {
          // If latched on empty space or target invalid, release immediately when emptySpaceCleanup is enabled
          if (cfg.arbitration.emptySpaceCleanup !== false) {
            authority = 0;
            this.latch = null;
          } else {
            const d = Math.abs(window.scrollY - this.scrollAtLatch);
            authority = d > cfg.arbitration.takeoverStartPx ? 0 : 1;
          }
        }
      } else {
        authority = 1; // never release
      }

      if (authority <= 0.001) {
        this.latch = null;
      }
    }

    // 4. Measure items and resolve channels
    const items = this.measureItems();
    const screenHits = cfg.modes.screen ? resolveScreen(items, vw, vh, cfg.screen) : [];
    const touchHit: HoverHit | null = (this.latch && this.latch.id)
      ? { id: this.latch.id, strength: 1.0, source: 'touch' }
      : null;

    const isCleanupFrame = Boolean(this.forceCleanup);
    this.forceCleanup = false;

    const hits = arbitrate({
      screenHits,
      touchHit,
      authority,
      modes: cfg.modes,
      isCleanup: isCleanupFrame || !this.latch?.id,
    });

    const hitsById = new Map<string, HoverHit>(hits.map(h => [h.id, h]));

    // 4b. Dwell filter evaluation for discrete triggers
    const dwellThreshold = cfg.arbitration.dwellThresholdMs ?? 0;
    const topHit = hits[0];
    let dwellActiveId: string | null = null;
    let dwellMet = true;

    if (topHit && topHit.strength >= 0.5) {
      dwellActiveId = topHit.id;
      if (!this.itemDwellTimers.has(topHit.id)) {
        this.itemDwellTimers.set(topHit.id, now);
      }
      const dwellElapsed = now - this.itemDwellTimers.get(topHit.id)!;
      dwellMet = dwellThreshold <= 0 || dwellElapsed >= dwellThreshold;
    }

    // Clean up timers for items no longer at peak strength
    for (const id of this.itemDwellTimers.keys()) {
      if (!topHit || id !== topHit.id) {
        this.itemDwellTimers.delete(id);
      }
    }

    const debug = {
      phase: g.phase,
      intent,
      authority,
      pointer: { x: g.x, y: g.y },
      zoneWeight: g.zoneWeight,
      zoneId: g.zoneId,
      scrollLocked: g.scrollLocked,
      holdMs: Math.round(lerp(cfg.touch.holdMsMax, cfg.touch.holdMsMin, g.zoneWeight)),
      elapsed: g.startTime ? Math.round((g.endTime ?? now) - g.startTime) : 0,
      latch: this.latch,
      scrollY: Math.round(window.scrollY),
      takeover: this.latch ? Math.round(Math.abs(window.scrollY - this.scrollAtLatch)) : 0,
      isCleanup: isCleanupFrame,
      dwellActiveId,
      dwellMet,
    };

    const newState: HoverSenseState = { hits, hitsById, debug, isCleanup: isCleanupFrame };
    this.currentState = newState;

    // Direct CSS custom property injection (zero-render styling at 60fps)
    if (this.cssBinder) {
      const elementsById = new Map<string, HTMLElement | null>();
      for (const [id, entry] of this.registry.entries()) {
        if (entry.target && typeof entry.target === 'object' && 'style' in entry.target) {
          elementsById.set(id, entry.target as HTMLElement);
        }
      }
      this.cssBinder.update(hits, elementsById, Boolean(this.latch));
    }

    // 5. Deduplicated event emission
    const stateKey = hits.map(h => `${h.id}:${h.source}:${Math.round(h.strength * 50)}`).join('|')
      + '#' + debug.phase + Math.round(intent * 20) + Math.round(authority * 20)
      + (debug.latch ? `${debug.latch.id ?? 'empty'},${Math.round(debug.latch.x)},${Math.round(debug.latch.y)}` : '-')
      + debug.scrollY + (debug.zoneId ?? '') + (debug.phase === 'probing' ? `${Math.round(g.x / 4)},${Math.round(g.y / 4)}` : '');

    if (stateKey !== this.lastStateKey || isCleanupFrame) {
      this.lastStateKey = stateKey;
      this.hoverListeners.forEach(cb => cb(hits, newState, isCleanupFrame));
      this.stateListeners.forEach(cb => cb(newState));
    }
  }

  // --- DOM Event Handlers ---

  private attachEvents(): void {
    if (typeof window === 'undefined') return;
    const stage = this.stageElement || window;
    stage.addEventListener('pointerdown', this.handlePointerDown as EventListener, { passive: true });
    window.addEventListener('pointermove', this.handlePointerMove as EventListener, { passive: true });
    window.addEventListener('pointerup', this.handlePointerUp as EventListener, { passive: true });
    window.addEventListener('pointercancel', this.handlePointerCancel as EventListener, { passive: true });
  }

  private detachEvents(): void {
    if (typeof window === 'undefined') return;
    const stage = this.stageElement || window;
    stage.removeEventListener('pointerdown', this.handlePointerDown as EventListener);
    window.removeEventListener('pointermove', this.handlePointerMove as EventListener);
    window.removeEventListener('pointerup', this.handlePointerUp as EventListener);
    window.removeEventListener('pointercancel', this.handlePointerCancel as EventListener);
  }

  private onPointerDown(e: PointerEvent): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const items = this.measureItems();
    const hitId = getHitUnderPoint({ x: e.clientX, y: e.clientY }, items, this.config.touch);
    const isTargetHit = hitId !== null;

    // Safe zones only discount touches that start on unassigned empty margins/bezels.
    // If touchdown directly hits an actionable item or within its snap threshold,
    // full confidence weight (1.0) is granted so edge items engage at full speed.
    const z = isTargetHit
      ? { weight: 1.0, zoneId: null }
      : sampleZones({ x: e.clientX, y: e.clientY }, this.config.safeZones, vw, vh);

    this.gesture = {
      phase: 'probing',
      down: true,
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      startTime: performance.now(),
      lastTime: performance.now(),
      endTime: null,
      zoneWeight: z.weight,
      zoneId: z.zoneId,
      scrollLocked: false,
    };

    this.gestureListeners.forEach(cb => cb(this.gesture));
  }

  private onPointerMove(e: PointerEvent): void {
    const g = this.gesture;
    if (!g.down) return;

    g.x = e.clientX;
    g.y = e.clientY;
    g.lastTime = performance.now();

    // Scroll-lock check: only during probing within the grace window
    if (g.phase === 'probing' && !g.scrollLocked) {
      const dt = g.lastTime - g.startTime;
      const dx = Math.abs(g.x - g.startX);
      const dy = Math.abs(g.y - g.startY);

      if (
        dt <= this.config.touch.scrollLockGraceMs &&
        dy > this.config.touch.dragDeadzonePx &&
        dy > dx * this.config.touch.scrollLockAxisRatio
      ) {
        g.scrollLocked = true; // Permanently classified as a native scroll
      }
    }
  }

  private onPointerUp(): void {
    const g = this.gesture;
    if (!g.down) return;

    g.down = false;
    g.endTime = performance.now();

    if (g.phase === 'engaged') {
      // Engaged gestures latch in place until scrolled away
      this.scrollAtLatch = window.scrollY;
    } else if (isTap(g, this.config.touch)) {
      const items = this.measureItems();
      const hitId = getHitUnderPoint({ x: g.startX, y: g.startY }, items, this.config.touch);
      if (!hitId) {
        // Tapping in empty space is a deliberate deselect / cleanup
        const wasLatched = Boolean(this.latch);
        this.latch = null;
        if (wasLatched || this.config.arbitration.emptySpaceCleanup !== false) {
          this.forceCleanup = true;
        }
      } else if (this.config.touch.clearLatchOnTap && this.latch?.id === hitId) {
        this.latch = null;
        this.forceCleanup = true;
      }
    }

    g.phase = 'idle';
    this.gestureListeners.forEach(cb => cb(g));
  }

  private onPointerCancel(): void {
    this.onPointerUp();
  }
}

/**
 * Factory helper function for creating a HoverSense instance.
 */
export function createHoverSense(
  options?: HoverSenseOptions,
  stage?: HTMLElement | Window | string
): HoverSense {
  return new HoverSense(options, stage);
}

export interface HoverSenseContainerController {
  /** The underlying HoverSense engine instance */
  engine: HoverSense;
  /** The visual feedback overlay instance, if enabled */
  feedback: HoverSenseFeedback | null;
  /** Re-scans the container for interactive items */
  refresh(): void;
  /** Cleans up all listeners, observers, feedback overlays, and CSS variables */
  destroy(): void;
}

/**
 * Turnkey helper that transforms any container element into a spatial hover experience.
 * Automatically handles touch hygiene, item discovery, mutation observation,
 * CSS custom property injection, and visual feedback overlays.
 *
 * Example:
 * ```ts
 * const controller = createHoverSenseContainer('#my-grid', {
 *   itemSelector: '.card',
 *   feedback: true,
 * });
 * ```
 */
export function createHoverSenseContainer(
  container: HTMLElement | string,
  options?: ContainerOptions
): HoverSenseContainerController {
  const containerEl = typeof container === 'string'
    ? (typeof document !== 'undefined' ? document.querySelector<HTMLElement>(container) : null)
    : container;

  const engine = new HoverSense(
    {
      ...options,
      bindCssVariables: options?.bindCssVariables ?? true,
      feedback: options?.feedback ?? true,
    },
    containerEl ?? undefined
  );

  if (!containerEl || typeof window === 'undefined') {
    return {
      engine,
      feedback: engine.getFeedback(),
      refresh: () => {},
      destroy: () => engine.destroy(),
    };
  }

  if (options?.applyHygiene !== false) {
    applyTouchHygiene(containerEl);
  }

  const selector = options?.itemSelector ?? '[data-hs-item], .hs-item, .card';
  let autoIdCounter = 0;
  const registeredElements = new Map<HTMLElement, string>();

  const registerItem = (el: HTMLElement) => {
    if (registeredElements.has(el)) return;
    const id = el.getAttribute('data-hs-id') || el.id || `hs-item-${++autoIdCounter}`;
    registeredElements.set(el, id);
    engine.register(id, el);
  };

  const unregisterItem = (el: HTMLElement) => {
    const id = registeredElements.get(el);
    if (id) {
      registeredElements.delete(el);
      engine.unregister(id);
    }
  };

  const refresh = () => {
    const items = containerEl.querySelectorAll<HTMLElement>(selector);
    const found = new Set<HTMLElement>();
    items.forEach(el => {
      found.add(el);
      registerItem(el);
    });

    for (const [el] of registeredElements.entries()) {
      if (!found.has(el) && !containerEl.contains(el)) {
        unregisterItem(el);
      }
    }
  };

  refresh();

  let observer: MutationObserver | null = null;
  if (options?.observeMutations !== false && typeof MutationObserver !== 'undefined') {
    observer = new MutationObserver(() => {
      refresh();
    });
    observer.observe(containerEl, { childList: true, subtree: true });
  }

  const destroy = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    registeredElements.clear();
    engine.destroy();
  };

  return {
    engine,
    feedback: engine.getFeedback(),
    refresh,
    destroy,
  };
}

