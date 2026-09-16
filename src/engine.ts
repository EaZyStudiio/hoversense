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
import type {
  Rect,
  MeasuredItem,
  HoverSenseConfig,
  HoverSenseOptions,
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
    },
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
      this.start();
    }
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
    this.registry.clear();
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
      this.latch = { id: hitId, x: g.startX, y: g.startY };
      this.scrollAtLatch = window.scrollY;
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
          // If latched on empty space, release after minor scroll
          const d = Math.abs(window.scrollY - this.scrollAtLatch);
          authority = d > cfg.arbitration.takeoverStartPx ? 0 : 1;
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

    const hits = arbitrate({
      screenHits,
      touchHit,
      authority,
      modes: cfg.modes,
    });

    const hitsById = new Map<string, HoverHit>(hits.map(h => [h.id, h]));

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
    };

    const newState: HoverSenseState = { hits, hitsById, debug };
    this.currentState = newState;

    // 5. Deduplicated event emission
    const stateKey = hits.map(h => `${h.id}:${h.source}:${Math.round(h.strength * 50)}`).join('|')
      + '#' + debug.phase + Math.round(intent * 20) + Math.round(authority * 20)
      + (debug.latch ? `${debug.latch.id ?? 'empty'},${Math.round(debug.latch.x)},${Math.round(debug.latch.y)}` : '-')
      + debug.scrollY + (debug.zoneId ?? '') + (debug.phase === 'probing' ? `${Math.round(g.x / 4)},${Math.round(g.y / 4)}` : '');

    if (stateKey !== this.lastStateKey) {
      this.lastStateKey = stateKey;
      this.hoverListeners.forEach(cb => cb(hits, newState));
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
      if (this.config.touch.clearLatchOnTap) {
        this.latch = null;
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
