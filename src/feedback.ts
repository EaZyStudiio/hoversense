/**
 * HoverSense Visual Feedback Module
 *
 * Renders high-fidelity mobile touch feedback overlays:
 * 1. Probing dwell timer: An SVG radial progress ring at the finger position.
 * 2. Latch authority dot: An illuminated spatial ring marking touch authority.
 *
 * Completely framework-agnostic with zero external dependencies.
 */

import type { HoverSense } from './engine';
import type { HoverSenseState } from './types';

export interface FeedbackOverlayOptions {
  /** Target parent element to mount the feedback container (default: document.body) */
  mount?: HTMLElement;
  /** Accent color for SVG circle and latch indicator (default: '#5b46d9') */
  accentColor?: string;
  /** Inactive/empty latch color (default: '#8a8fa3') */
  emptyColor?: string;
  /** Custom z-index for the overlay layer (default: 9999) */
  zIndex?: number;
}

export class HoverSenseFeedback {
  private rootEl: HTMLElement | null = null;
  private svgEl: SVGSVGElement | null = null;
  private circleEl: SVGCircleElement | null = null;
  private latchEl: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private options: Required<FeedbackOverlayOptions>;

  constructor(options?: FeedbackOverlayOptions) {
    this.options = {
      mount: options?.mount ?? (typeof document !== 'undefined' ? document.body : (null as unknown as HTMLElement)),
      accentColor: options?.accentColor ?? '#5b46d9',
      emptyColor: options?.emptyColor ?? '#8a8fa3',
      zIndex: options?.zIndex ?? 9999,
    };
  }

  /**
   * Attaches the feedback overlay to an active HoverSense engine instance.
   */
  public attach(engine: HoverSense): this {
    if (typeof window === 'undefined' || !this.options.mount) return this;

    this.ensureElements();

    this.unsubscribe = engine.onState((state: HoverSenseState) => {
      this.render(state);
    });

    return this;
  }

  /**
   * Updates overlay DOM positions and geometry based on engine state.
   */
  public render(state: HoverSenseState): void {
    if (!this.rootEl) return;

    const { debug } = state;
    const isProbing = debug.phase === 'probing' && !debug.scrollLocked && debug.intent > 0;
    const isLatched = Boolean(debug.latch);

    if (!isProbing && !isLatched) {
      this.rootEl.style.display = 'none';
      return;
    }

    this.rootEl.style.display = 'block';

    // Position at finger while probing, or at initial touchdown once latched
    const posX = isProbing ? debug.pointer.x : (debug.latch?.x ?? 0);
    const posY = isProbing ? debug.pointer.y : (debug.latch?.y ?? 0);

    this.rootEl.style.left = `${posX}px`;
    this.rootEl.style.top = `${posY}px`;

    // 1. Probing radial dwell timer
    if (this.svgEl && this.circleEl) {
      if (isProbing) {
        this.svgEl.style.display = 'block';
        const offset = 100 - (debug.intent * 100);
        this.circleEl.setAttribute('stroke-dashoffset', offset.toFixed(1));
      } else {
        this.svgEl.style.display = 'none';
      }
    }

    // 2. Latch authority dot
    if (this.latchEl) {
      if (isLatched && debug.latch) {
        this.latchEl.style.display = 'flex';
        const hasTarget = Boolean(debug.latch.id);

        if (hasTarget) {
          const authority = debug.authority ?? 1;
          this.latchEl.style.opacity = `${0.25 + authority * 0.75}`;
          this.latchEl.style.borderColor = this.options.accentColor;
          this.latchEl.style.borderStyle = 'solid';
          this.latchEl.classList.remove('hs-empty');
        } else {
          this.latchEl.style.opacity = '0.4';
          this.latchEl.style.borderColor = this.options.emptyColor;
          this.latchEl.style.borderStyle = 'dashed';
          this.latchEl.classList.add('hs-empty');
        }
      } else {
        this.latchEl.style.display = 'none';
      }
    }
  }

  /**
   * Destroys the feedback elements and detaches listeners.
   */
  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.rootEl && this.rootEl.parentElement) {
      this.rootEl.parentElement.removeChild(this.rootEl);
      this.rootEl = null;
      this.svgEl = null;
      this.circleEl = null;
      this.latchEl = null;
    }
  }

  private ensureElements(): void {
    if (this.rootEl || typeof document === 'undefined') return;

    const root = document.createElement('div');
    root.className = 'hs-feedback-root';
    root.style.position = 'fixed';
    root.style.zIndex = String(this.options.zIndex);
    root.style.pointerEvents = 'none';
    root.style.transform = 'translate(-50%, -50%)';
    root.style.display = 'none';
    root.style.setProperty('--hs-accent-color', this.options.accentColor);

    // SVG Circular Dwell Progress Timer
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '40');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('class', 'hs-feedback-progress');
    svg.style.transform = 'rotate(-90deg)';
    svg.style.overflow = 'visible';
    svg.style.display = 'none';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '20');
    circle.setAttribute('cy', '20');
    circle.setAttribute('r', '16');
    circle.setAttribute('class', 'hs-feedback-circle');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', this.options.accentColor);
    circle.setAttribute('stroke-width', '3');
    circle.setAttribute('stroke-dasharray', '100');
    circle.setAttribute('stroke-dashoffset', '100');
    circle.setAttribute('opacity', '0.85');

    svg.appendChild(circle);
    root.appendChild(svg);

    // Latch Dot Ring
    const latch = document.createElement('div');
    latch.className = 'hs-feedback-latch';
    latch.style.width = '22px';
    latch.style.height = '22px';
    latch.style.borderRadius = '50%';
    latch.style.border = `2px solid ${this.options.accentColor}`;
    latch.style.position = 'relative';
    latch.style.display = 'none';
    latch.style.alignItems = 'center';
    latch.style.justifyContent = 'center';

    const innerDot = document.createElement('i');
    innerDot.style.width = '6px';
    innerDot.style.height = '6px';
    innerDot.style.borderRadius = '50%';
    innerDot.style.backgroundColor = this.options.accentColor;
    innerDot.style.display = 'block';
    latch.appendChild(innerDot);

    root.appendChild(latch);

    this.options.mount.appendChild(root);

    this.rootEl = root;
    this.svgEl = svg;
    this.circleEl = circle;
    this.latchEl = latch;
  }
}

/**
 * Creates and attaches a visual feedback overlay to a HoverSense instance.
 */
export function createHoverSenseFeedback(
  engine: HoverSense,
  options?: FeedbackOverlayOptions
): HoverSenseFeedback {
  const feedback = new HoverSenseFeedback(options);
  feedback.attach(engine);
  return feedback;
}
