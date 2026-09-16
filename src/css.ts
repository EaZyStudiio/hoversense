/**
 * HoverSense CSS Engine and Utilities
 *
 * Provides CSS custom property bindings and touch hygiene rules.
 * Enables zero-render styling at 60fps where host components update
 * via hardware-accelerated transforms without framework re-renders.
 */

import type { HoverHit } from './types';

/**
 * CSS custom properties applied to hovered elements.
 */
export const CSS_VARS = {
  STRENGTH: '--hs-strength',
  SOURCE: '--hs-source',
  LATCHED: '--hs-latched',
} as const;

/**
 * Data attributes applied to hovered elements.
 */
export const DATA_ATTRS = {
  HOVER: 'data-hs-hover',
  SOURCE: 'data-hs-source',
} as const;

/**
 * Essential CSS rules required for smooth touch interactions on mobile browsers.
 * Suppresses default browser callouts and enables native pan-y scrolling.
 */
export const TOUCH_HYGIENE_STYLES = `
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: pan-y;
`;

/**
 * Applies mobile touch hygiene styles to a target container element.
 */
export function applyTouchHygiene(element: HTMLElement): void {
  element.style.userSelect = 'none';
  element.style.webkitUserSelect = 'none';
  (element.style as unknown as Record<string, string>)['-webkit-tap-highlight-color'] = 'transparent';
  (element.style as unknown as Record<string, string>)['-webkit-touch-callout'] = 'none';
  element.style.touchAction = 'pan-y';
}

export interface CssBinderOptions {
  /**
   * Minimum strength change before updating the CSS variable (default: 0.005).
   * Prevents sub-pixel paint thrashing.
   */
  precision?: number;

  /**
   * Set data-hs-hover and data-hs-source attributes (default: true).
   */
  setAttributes?: boolean;
}

/**
 * Manages binding CSS variables directly to DOM elements.
 * Keeps track of previously styled elements to efficiently clear state when hover exits.
 */
export class CssVariableBinder {
  private activeElements = new Map<HTMLElement, { strength: number; source: string; latched: boolean }>();
  private precision: number;
  private setAttributes: boolean;

  constructor(options?: CssBinderOptions) {
    this.precision = options?.precision ?? 0.005;
    this.setAttributes = options?.setAttributes ?? true;
  }

  /**
   * Updates CSS variables on current hit elements and resets exited elements.
   */
  public update(hits: HoverHit[], elementsById: Map<string, HTMLElement | null>, isLatched = false): void {
    const nextElements = new Map<HTMLElement, { strength: number; source: string; latched: boolean }>();

    for (const hit of hits) {
      const el = elementsById.get(hit.id);
      if (!el) continue;

      const strength = Math.round(hit.strength * 1000) / 1000;
      const source = hit.source;
      const latched = isLatched && source === 'touch';

      nextElements.set(el, { strength, source, latched });

      const prev = this.activeElements.get(el);
      const changed = !prev ||
        Math.abs(prev.strength - strength) >= this.precision ||
        prev.source !== source ||
        prev.latched !== latched;

      if (changed) {
        el.style.setProperty(CSS_VARS.STRENGTH, strength.toFixed(3));
        el.style.setProperty(CSS_VARS.SOURCE, source);
        el.style.setProperty(CSS_VARS.LATCHED, latched ? '1' : '0');

        if (this.setAttributes) {
          el.setAttribute(DATA_ATTRS.HOVER, 'active');
          el.setAttribute(DATA_ATTRS.SOURCE, source);
        }
      }
    }

    // Clean up elements that are no longer hit
    for (const [el] of this.activeElements.entries()) {
      if (!nextElements.has(el)) {
        this.clearElement(el);
      }
    }

    this.activeElements = nextElements;
  }

  /**
   * Clears all CSS variables and attributes from an element.
   */
  public clearElement(el: HTMLElement): void {
    el.style.removeProperty(CSS_VARS.STRENGTH);
    el.style.removeProperty(CSS_VARS.SOURCE);
    el.style.removeProperty(CSS_VARS.LATCHED);

    if (this.setAttributes) {
      el.removeAttribute(DATA_ATTRS.HOVER);
      el.removeAttribute(DATA_ATTRS.SOURCE);
    }
  }

  /**
   * Clears all currently styled elements.
   */
  public clear(): void {
    for (const [el] of this.activeElements.entries()) {
      this.clearElement(el);
    }
    this.activeElements.clear();
  }
}
