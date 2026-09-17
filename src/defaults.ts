/**
 * HoverSense - Default Settings & Constants
 *
 * Every numeric constant is derived from empirical human ergonomics:
 * - Thumb-reach geometry and natural holding postures.
 * - Long-press discrimination against browser context menu triggers.
 * - Capacitive screen sensor jitter versus intentional drag vectors.
 */

import type { HoverSenseConfig, SafeZone } from './types';

export const DEFAULT_SAFE_ZONES: SafeZone[] = [
  // Bottom thumb-rest area where the palm or resting thumb sits during one-handed grip.
  { id: 'thumb-rest', left: 0, right: 1, top: 0.80, bottom: 1.00, weight: 0.00, featherPx: 110 },

  // Left screen edge (suppresses accidental edge grips and system back navigation gestures).
  { id: 'edge-left', left: 0, right: 0.07, top: 0, bottom: 1, weight: 0.25, featherPx: 40 },

  // Right screen edge (suppresses palm contact and system edge swiping).
  { id: 'edge-right', left: 0.93, right: 1, top: 0, bottom: 1, weight: 0.25, featherPx: 40 },

  // Top chrome and status bar region (system pull-down notch/island area).
  { id: 'top-chrome', left: 0, right: 1, top: 0, bottom: 0.09, weight: 0.00, featherPx: 50 },
];

export const DEFAULT_CONFIG: HoverSenseConfig = {
  screen: {
    // 0.42 viewport ratio: on phones, thumb and bottom docks occlude the lower half.
    // Natural reading gaze settles slightly above geometric center (42% from top).
    anchorRatio: 0.42,

    // 0.30vh falloff radius: roughly 1.5 standard card heights on mobile.
    // Decay curve smoothly transitions over adjacent neighboring items.
    bandRatio: 0.30,

    // 'global': single winner across column boundaries (ideal for single stream).
    // 'per-column': column-independent winners (for masonry, offset columns, or grids).
    resolve: 'global',

    // In-row column split weight (0.0 to 1.0).
    // 0.0: all columns in a row hover together at 100%.
    // 1.0: row height is split across N columns with linear crossfade easing.
    rowSplit: 0.0,
  },

  touch: {
    // 320ms: safely above deliberate tap latency (~150ms) and hardware jitter,
    // but comfortably below the 500ms OS long-press text selection / context menu.
    holdMsMin: 320,

    // 1200ms: maximum hold time in low-confidence safe zones.
    // Safe zones do not block interaction; they make inadvertent activation expensive.
    holdMsMax: 1200,

    // 9px: sub-threshold capacitive touch jitter filter.
    dragDeadzonePx: 9,

    // 46px: roughly half the width of an adult fingertip contact patch.
    // Unmistakable intentional lateral drag.
    dragFullPx: 46,

    // 0.22: vertical movement is dominated by page scrolling.
    // Dampening vertical displacement ensures vertical swipes trigger native scrolling.
    verticalDragWeight: 0.22,

    // 220ms: initial time window after touchdown where vertical flick locks into native scroll.
    scrollLockGraceMs: 220,

    // 1.3 ratio: |dy| > |dx| * 1.3 classifies the gesture definitively as a vertical scroll.
    scrollLockAxisRatio: 1.3,

    // 0.90: 90% intent accumulation required before locking touch hover state.
    engageAt: 0.90,

    // Tap classification thresholds (passed through to native click/navigation).
    tapMaxMs: 180,
    tapMaxMovePx: 10,

    // 42px: proximity cushion outside card boundaries for fluid touch selection.
    outerFalloffPx: 42,

    // 0.40: 40% of inter-item gap belongs to edge snapping; center 60% deselects cleanly.
    inBetweenRatio: 0.40,

    // Tap behavior when an item is latched.
    clearLatchOnTap: false,
  },

  arbitration: {
    // 180px: small page adjustments or settling scrolls do not dismiss touch lock.
    takeoverStartPx: 180,

    // 560px: deliberate full-screen scroll cleanly hands authority back to screen channel.
    takeoverFullPx: 560,

    // 'off-screen': touch latch retains authority until the locked item leaves viewport.
    releaseMode: 'off-screen',

    // true: tapping/engaging in empty space forces immediate cleanup and Gaze takeover.
    emptySpaceCleanup: true,
  },

  safeZones: DEFAULT_SAFE_ZONES,

  modes: {
    screen: true,
    touch: true,
  },
};
