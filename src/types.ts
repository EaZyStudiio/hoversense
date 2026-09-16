/**
 * HoverSense - Type Definitions
 * Framework-agnostic pointerless interaction model for touch interfaces.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface MeasuredItem {
  id: string;
  rect: Rect;
  data?: Record<string, unknown>;
}

export interface SafeZone {
  /** Identifier for debugging and logging */
  id: string;
  /** Normalized viewport left coordinate (0.0 to 1.0) */
  left: number;
  /** Normalized viewport right coordinate (0.0 to 1.0) */
  right: number;
  /** Normalized viewport top coordinate (0.0 to 1.0) */
  top: number;
  /** Normalized viewport bottom coordinate (0.0 to 1.0) */
  bottom: number;
  /**
   * Safe zone weight (0.0 to 1.0).
   * 0.0 means gestures starting here are ignored completely.
   * 1.0 means no suppression.
   */
  weight: number;
  /** Feather gradient cushion in pixels straddling the boundary */
  featherPx: number;
}

export interface ScreenChannelConfig {
  /**
   * Vertical position of the virtual anchor line as a fraction of viewport height.
   * Default: 0.42 (slightly above center to accommodate reading gaze and thumb occlusion).
   */
  anchorRatio: number;

  /**
   * Falloff band radius as a fraction of viewport height.
   * Target exactly on the anchor line receives strength 1.0; strength decays to 0.0 at band edge.
   */
  bandRatio: number;

  /**
   * Row clustering and column stagger resolution mode.
   * 'global': exactly one winner across the entire screen.
   * 'per-column': independent winners per detected column.
   */
  resolve: 'global' | 'per-column';

  /**
   * In-row column split weight (0.0 to 1.0).
   * 0.0 = Simultaneous: all columns in a row hover together at 100%.
   * 1.0 = Strict Split: row height is divided by column count with linear gradient easing crossfade.
   */
  rowSplit: number;
}

export interface TouchChannelConfig {
  /** Fastest possible touch engage duration in milliseconds in a fully live zone (default: 320ms). */
  holdMsMin: number;

  /** Slowest touch engage duration in milliseconds in a suppressed safe zone (default: 1200ms). */
  holdMsMax: number;

  /** Movement threshold in pixels below which displacement is treated as finger noise (default: 9px). */
  dragDeadzonePx: number;

  /** Displacement in pixels required to reach 100% drag intent (default: 46px). */
  dragFullPx: number;

  /** Vertical drag weight multiplier (default: 0.22, dampening vertical travel vs scrolling). */
  verticalDragWeight: number;

  /** Millisecond window from touchdown within which vertical flick locks into native scroll (default: 220ms). */
  scrollLockGraceMs: number;

  /** Aspect ratio threshold (|dy| / |dx|) to trigger scroll lock (default: 1.3). */
  scrollLockAxisRatio: number;

  /** Accumulated intent threshold (0.0 to 1.0) required to engage and latch touch hover (default: 1.0). */
  engageAt: number;

  /** Maximum duration in milliseconds for a gesture to be classified as a click/tap (default: 180ms). */
  tapMaxMs: number;

  /** Maximum movement in pixels for a gesture to be classified as a click/tap (default: 10px). */
  tapMaxMovePx: number;

  /** Outer cushion in pixels outside item boundaries where proximity snap remains active (default: 42px). */
  outerFalloffPx: number;

  /**
   * In-between gap snap ratio (0.0 to 1.0).
   * 0.0 = Gutter space is deadzone (touching gutters deselects).
   * 0.4 = 40% of gap snaps to edges; center 60% remains deadzone.
   * 1.0 = Full greedy snapping to midpoints.
   */
  inBetweenRatio: number;

  /** If true, tapping outside or on items clears an existing touch latch (default: false). */
  clearLatchOnTap: boolean;
}

export interface ArbitrationConfig {
  /** Scroll distance in pixels before touch authority begins decaying back to screen channel (default: 180px). */
  takeoverStartPx: number;

  /** Scroll distance in pixels where touch authority reaches 0.0 (default: 560px). */
  takeoverFullPx: number;

  /**
   * Authority release mode:
   * 'scroll': Smooth decay over takeoverStartPx to takeoverFullPx.
   * 'off-screen': Latched item holds authority until it completely scrolls out of viewport.
   * 'never': Touch latch persists indefinitely until another touch takes over.
   */
  releaseMode: 'scroll' | 'off-screen' | 'never';
}

export interface HoverSenseConfig {
  screen: ScreenChannelConfig;
  touch: TouchChannelConfig;
  arbitration: ArbitrationConfig;
  safeZones: SafeZone[];
  modes: {
    screen: boolean;
    touch: boolean;
  };
}

export interface HoverSenseOptions {
  screen?: Partial<ScreenChannelConfig>;
  touch?: Partial<TouchChannelConfig>;
  arbitration?: Partial<ArbitrationConfig>;
  safeZones?: SafeZone[];
  modes?: {
    screen?: boolean;
    touch?: boolean;
  };
}

export type GesturePhase = 'idle' | 'probing' | 'engaged';

export interface GestureState {
  phase: GesturePhase;
  startX: number;
  startY: number;
  x: number;
  y: number;
  startTime: number;
  lastTime: number;
  endTime: number | null;
  zoneWeight: number;
  zoneId: string | null;
  scrollLocked: boolean;
  down: boolean;
}

export interface TouchLatch {
  id: string | null;
  x: number;
  y: number;
}

export interface HoverHit {
  id: string;
  strength: number;
  source: 'screen' | 'touch';
}

export interface HoverSenseDebugState {
  phase: GesturePhase;
  intent: number;
  authority: number;
  pointer: Point;
  zoneWeight: number;
  zoneId: string | null;
  scrollLocked: boolean;
  holdMs: number;
  elapsed: number;
  latch: TouchLatch | null;
  scrollY: number;
  takeover: number;
}

export interface HoverSenseState {
  hits: HoverHit[];
  hitsById: Map<string, HoverHit>;
  debug: HoverSenseDebugState;
}

export type HoverCallback = (hits: HoverHit[], state: HoverSenseState) => void;
export type StateCallback = (state: HoverSenseState) => void;
export type GestureCallback = (gesture: GestureState) => void;
export type IntentCallback = (intent: number, gesture: GestureState) => void;
