/**
 * HoverSense Mathematics Core
 *
 * This module is completely standalone, pure, and dependency-free.
 * It contains all mathematical modeling, geometric distance equations,
 * signal processing, intent accumulation, biomechanical safe-zone vectors,
 * and channel arbitration formulas for HoverSense.
 *
 * No DOM, no browser APIs, no framework dependencies.
 */

import type {
  Point,
  Rect,
  MeasuredItem,
  SafeZone,
  GestureState,
  HoverHit,
  ScreenChannelConfig,
  TouchChannelConfig,
} from './types';

/**
 * Clamps a numeric value between a minimum and maximum boundary.
 *
 * Mathematical definition:
 * clamp(v, lo, hi) = min(max(v, lo), hi)
 *
 * @param v The input value to constrain.
 * @param lo Lower bound.
 * @param hi Upper bound.
 * @returns Constrained value within [lo, hi].
 */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/**
 * Standard linear interpolation between two values.
 *
 * Mathematical definition:
 * lerp(a, b, t) = a + (b - a) * t
 *
 * @param a Starting value when t = 0.
 * @param b Target value when t = 1.
 * @param t Normalized progress factor.
 * @returns Interpolated value.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Cubic Hermite smoothstep interpolation curve.
 *
 * Provides a smooth S-curve transition with zero 1st derivatives at boundaries (t=0 and t=1).
 * This eliminates abrupt visual jumps or hard velocity discontinuities in proximity highlights.
 *
 * Mathematical formula:
 * S(x) = 3x^2 - 2x^3 where x = clamp(t, 0, 1)
 *
 * @param t Normalized input factor in range [0, 1].
 * @returns Smoothly eased factor in range [0, 1].
 */
export function smooth(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Computes the shortest Euclidean distance from a 2D point to an axis-aligned rectangle.
 *
 * If the point is inside the rectangle boundaries, the distance is strictly 0.
 * If outside along an edge, it returns the perpendicular distance.
 * If outside across a diagonal corner, it returns the Euclidean hypotenuse to the corner vertex.
 *
 * Formula:
 * dx = max(0, rect.left - pt.x, pt.x - rect.right)
 * dy = max(0, rect.top - pt.y, pt.y - rect.bottom)
 * distance = sqrt(dx^2 + dy^2)
 *
 * @param pt Coordinate point {x, y}.
 * @param r Bounding rectangle {left, right, top, bottom}.
 * @returns Non-negative Euclidean distance in pixels.
 */
export function distToRect(pt: Point, r: Rect): number {
  const dx = Math.max(0, r.left - pt.x, pt.x - r.right);
  const dy = Math.max(0, r.top - pt.y, pt.y - r.bottom);
  return Math.hypot(dx, dy);
}

/**
 * Calculates how deeply a coordinate point penetrates into a rectangular safe zone,
 * producing a continuous [0.0, 1.0] gradient with feathered boundary borders.
 *
 * Biomechanical Rationale:
 * Human hands do not interact with screen hardware as sharp geometric step functions.
 * When a thumb rests near the bottom bezel, proximity to the boundary varies continuously.
 * Feathering creates a soft gradient buffer (default 40px to 110px) straddling the safe zone edge,
 * preventing erratic flickering when fingers land near the boundary.
 *
 * @param pt Coordinate point {x, y}.
 * @param z Safe zone configuration in normalized viewport coordinates [0.0, 1.0].
 * @param vw Current viewport width in pixels.
 * @param vh Current viewport height in pixels.
 * @returns Penetration factor from 0.0 (outside) to 1.0 (fully inside).
 */
export function zonePenetration(pt: Point, z: SafeZone, vw: number, vh: number): number {
  const l = z.left * vw;
  const r = z.right * vw;
  const t = z.top * vh;
  const b = z.bottom * vh;
  const f = Math.max(1, z.featherPx ?? 60);

  // Signed distance to the nearest interior edge: positive inside, negative outside
  const d = Math.min(pt.x - l, r - pt.x, pt.y - t, b - pt.y);

  // Smoothstep centered on the boundary with width f
  return smooth((d + f / 2) / f);
}

/**
 * Evaluates the hand resting posture at gesture touchdown.
 *
 * Biomechanical Principle:
 * Safe zones are consulted exclusively at touchdown (g.startX, g.startY).
 * If a gesture begins in a suppressed zone (e.g. resting thumb or palm holding the bezel),
 * the entire subsequent gesture is penalized, even if the finger wanders onto content.
 * Conversely, if a touch originates intentionally on content, it is granted full confidence.
 *
 * @param pt Touchdown coordinate point.
 * @param zones Array of configured safe zones.
 * @param vw Viewport width.
 * @param vh Viewport height.
 * @returns Object with the lowest confidence weight and matching zone ID.
 */
export function sampleZones(
  pt: Point,
  zones: SafeZone[],
  vw: number,
  vh: number
): { weight: number; zoneId: string | null } {
  let weight = 1.0;
  let hit: string | null = null;

  for (const z of zones) {
    const p = zonePenetration(pt, z, vw, vh);
    if (p <= 0) continue;

    // Interpolate from 1.0 (neutral) to z.weight (suppression factor)
    const w = lerp(1.0, z.weight, p);
    if (w < weight) {
      weight = w;
      hit = z.id;
    }
  }

  return { weight, zoneId: hit };
}

/**
 * Dual-Channel Intent Accumulator.
 *
 * Calculates a normalized intent score in range [0.0, 1.0] by fusing two independent
 * streams of physical evidence:
 * 1. Time Held (Hold Channel): Measures conscious contact dwell.
 * 2. Distance Dragged (Drag Channel): Measures deliberate lateral travel across items.
 *
 * Safe Zone Penalty Resolution:
 * Suppressed safe zones penalize gestures by stretching the required hold threshold from
 * holdMsMin (e.g. 320ms) up to holdMsMax (e.g. 1200ms). Once the stretched hold time is satisfied,
 * intent is fully granted. Drag displacement remains scaled by zone weight.
 *
 * @param g Current gesture state object.
 * @param cfg Touch channel configuration parameters.
 * @param now Current timestamp in milliseconds (performance.now()).
 * @returns Normalized intent value in range [0.0, 1.0].
 */
export function computeIntent(g: GestureState, cfg: TouchChannelConfig, now: number): number {
  if (g.scrollLocked) return 0;
  if (g.zoneWeight <= 0.001) return 0;

  // 1. Compute dynamic hold threshold based on zone confidence
  const holdMs = lerp(cfg.holdMsMax, cfg.holdMsMin, g.zoneWeight);
  const elapsed = (g.endTime ?? now) - g.startTime;
  const holdIntent = clamp(elapsed / Math.max(1, holdMs), 0, 1);

  // 2. Compute drag displacement intent with vertical dampening
  const dx = g.x - g.startX;
  const dy = g.y - g.startY;
  const effectiveDisplacement = Math.hypot(dx, dy * cfg.verticalDragWeight);

  const dragDeadzone = cfg.dragDeadzonePx;
  const dragSpan = Math.max(1, cfg.dragFullPx - dragDeadzone);
  const dragIntent = clamp((effectiveDisplacement - dragDeadzone) / dragSpan, 0, 1);

  // Max of hold channel and drag channel (scaled by zone weight)
  return clamp(Math.max(holdIntent, dragIntent * g.zoneWeight), 0, 1);
}

/**
 * Classifies whether a completed gesture represents a standard tap or click.
 *
 * Tap gestures (short duration and minimal movement) are passed through to the host
 * application to preserve standard hyperlink navigation, form inputs, and buttons.
 *
 * @param g Completed gesture state.
 * @param cfg Touch channel configuration.
 * @returns True if the gesture qualifies as a click/tap.
 */
export function isTap(g: GestureState, cfg: TouchChannelConfig): boolean {
  const duration = (g.endTime ?? g.lastTime) - g.startTime;
  const movement = Math.hypot(g.x - g.startX, g.y - g.startY);
  return duration <= cfg.tapMaxMs && movement <= cfg.tapMaxMovePx;
}

export interface RowGroup {
  top: number;
  bottom: number;
  height: number;
  items: MeasuredItem[];
}

/**
 * Dynamically clusters registered items into horizontal rows based on vertical overlap.
 *
 * Geometry Algorithm:
 * 1. Sort items by top coordinate.
 * 2. Merge items into an existing row if vertical overlap exceeds 20% of item height.
 * 3. Sort items within each row horizontally from left to right.
 *
 * @param items Array of measured bounding items.
 * @returns Array of grouped rows.
 */
export function groupByRow(items: MeasuredItem[]): RowGroup[] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.rect.top - b.rect.top);
  const rows: RowGroup[] = [];

  for (const it of sorted) {
    const matchingRow = rows.find(row => {
      const overlap = Math.min(row.bottom, it.rect.bottom) - Math.max(row.top, it.rect.top);
      return overlap > it.rect.height * 0.2;
    });

    if (!matchingRow) {
      rows.push({
        top: it.rect.top,
        bottom: it.rect.bottom,
        height: Math.max(1, it.rect.height),
        items: [it],
      });
    } else {
      matchingRow.items.push(it);
      matchingRow.top = Math.min(matchingRow.top, it.rect.top);
      matchingRow.bottom = Math.max(matchingRow.bottom, it.rect.bottom);
      matchingRow.height = Math.max(1, matchingRow.bottom - matchingRow.top);
    }
  }

  // Sort items horizontally within each row
  for (const r of rows) {
    r.items.sort((a, b) => (a.rect.left + a.rect.width / 2) - (b.rect.left + b.rect.width / 2));
  }

  return rows;
}

/**
 * Screen Position Channel Resolution.
 *
 * Evaluates item proximity to the horizontal gaze anchor line (default: 42% viewport height).
 * Uses smoothstep falloff over the configurable band radius (default: 30% viewport height).
 *
 * In-Row Column Stagger Split (rowSplit option):
 * When multiple columns exist in a single row (e.g. 2-column or 3-column grids):
 * - rowSplit = 0.0: all columns in the row highlight simultaneously at 100%.
 * - rowSplit = 1.0: row height is divided into N vertical sub-slices (e.g. 50/50 for 2-col,
 *   33.3% each for 3-col) with smooth linear crossfading between columns.
 *
 * @param items Registered measured items.
 * @param vw Viewport width.
 * @param vh Viewport height.
 * @param cfg Screen channel configuration.
 * @returns Array of calculated hover hits with strength [0.0, 1.0].
 */
export function resolveScreen(
  items: MeasuredItem[],
  _vw: number,
  vh: number,
  cfg: ScreenChannelConfig
): HoverHit[] {
  if (!items.length) return [];
  const anchorY = vh * cfg.anchorRatio;
  const band = Math.max(1, vh * cfg.bandRatio);
  const rows = groupByRow(items);
  const out: HoverHit[] = [];

  for (const row of rows) {
    const N = row.items.length;
    // Relative position of anchor line within this row (0.0 at top, 1.0 at bottom)
    const v = clamp((anchorY - row.top) / Math.max(1, row.height), 0, 1);
    const sliceWidth = 1 / N;

    row.items.forEach((it, colIdx) => {
      const cy = it.rect.top + it.rect.height / 2;
      const d = Math.abs(cy - anchorY);
      const baseStrength = smooth(1 - d / band);
      if (baseStrength <= 0.001) return;

      let colWeight = 1.0;
      if (N > 1 && (cfg.rowSplit ?? 0) > 0) {
        // Center position of this column's vertical slice in the row
        const colCenter = (colIdx + 0.5) * sliceWidth;
        const distFromCenter = Math.abs(v - colCenter);
        // Linear crossfade gradient falloff spanning sliceWidth
        const splitStrength = clamp(1 - distFromCenter / sliceWidth, 0, 1);

        colWeight = lerp(1.0, splitStrength, cfg.rowSplit);
      }

      const finalStrength = baseStrength * colWeight;
      if (finalStrength > 0.001) {
        out.push({ id: it.id, strength: finalStrength, source: 'screen' });
      }
    });
  }

  return out;
}

/**
 * Edge-Aware Touch Hit Target Resolution.
 *
 * Determines which item is targeted by a touch coordinate using Euclidean boundary distance,
 * outer margin snapping, and inter-item gutter deadzones.
 *
 * Mathematical Rules:
 * 1. Direct Bounding Box Hit: If point is inside an item rect, distance is 0 -> immediate hit.
 * 2. Outer Margin Snapping: If outside all items, measures distance to closest edge. Snaps to
 *    closest item if distance <= outerFalloffPx (default: 42px).
 * 3. Inter-Item Gutter Deadzone: In the gap between two adjacent items, the allowable snap
 *    distance is scaled by inBetweenRatio. Touching the exact center of a wide gutter returns null,
 *    enabling the user to tap/hold empty space to cleanly deselect.
 *
 * @param point Coordinate point {x, y}.
 * @param items Array of measured candidate items.
 * @param cfg Touch channel configuration.
 * @returns Target item ID or null if in deadzone / empty space.
 */
export function getHitUnderPoint(
  point: Point | null,
  items: MeasuredItem[],
  cfg: TouchChannelConfig
): string | null {
  if (!point || !items.length) return null;

  // 1. Direct Hit
  const direct = items.find(it => {
    const r = it.rect;
    return point.x >= r.left && point.x <= r.right && point.y >= r.top && point.y <= r.bottom;
  });
  if (direct) return direct.id;

  // 2. Measure Euclidean edge distances to all targets
  const dists = items
    .map(it => ({ id: it.id, d: distToRect(point, it.rect) }))
    .sort((a, b) => a.d - b.d);

  const closest = dists[0];
  const second = dists[1];

  const outerFalloff = cfg.outerFalloffPx ?? 42;
  const inBetweenRatio = clamp(cfg.inBetweenRatio ?? 0.40, 0, 1);

  let effectiveFalloff = outerFalloff;
  if (second) {
    // Total empty gap span between the two closest items along the touch path
    const gapSpan = closest.d + second.d;
    const gapAllowance = (gapSpan / 2) * inBetweenRatio;
    effectiveFalloff = Math.min(outerFalloff, gapAllowance);
  }

  if (closest.d <= effectiveFalloff) {
    return closest.id;
  }

  // Point is in true empty space or deadzone gutter
  return null;
}

export interface ArbitrateParams {
  screenHits: HoverHit[];
  touchHit: HoverHit | null;
  authority: number;
  modes: {
    screen: boolean;
    touch: boolean;
  };
}

/**
 * Channel Arbitration.
 *
 * Blends the Screen channel (passive gaze anchor) and Touch channel (active finger engagement).
 *
 * Arbitration Rules:
 * - Touch Off: Pure screen channel resolution.
 * - Screen Off: Pure touch channel resolution (no hover until active touch engagement).
 * - Both Active: Touch holds authority while engaged. Screen channel intensity is scaled by
 *   (1.0 - authority), creating a seamless mathematical crossfade without abrupt snapping.
 *
 * @param params Arbitration parameters.
 * @returns Sorted array of winning hover targets.
 */
export function arbitrate(params: ArbitrateParams): HoverHit[] {
  const { screenHits, touchHit, authority, modes } = params;
  const map = new Map<string, HoverHit>();

  const addHit = (h: HoverHit | null, multiplier: number) => {
    if (!h) return;
    const s = h.strength * multiplier;
    if (s <= 0.001) return;
    const prev = map.get(h.id);
    if (!prev || s > prev.strength) {
      map.set(h.id, { ...h, strength: s });
    }
  };

  if (modes.screen) {
    const screenScale = modes.touch ? 1 - authority : 1.0;
    screenHits.forEach(h => addHit(h, screenScale));
  }

  if (modes.touch) {
    addHit(touchHit, authority);
  }

  return Array.from(map.values()).sort((a, b) => b.strength - a.strength);
}
