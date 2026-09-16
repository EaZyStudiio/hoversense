"""
HoverSense Mathematics Core (Python Reference Implementation)
Framework-agnostic pointerless interaction model for touch interfaces.

Contains pure mathematical models, geometric distance equations,
signal processing curves, intent accumulators, and channel arbitration.
Zero external dependencies.
"""

import math
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass


@dataclass
class Point:
    x: float
    y: float


@dataclass
class Rect:
    left: float
    right: float
    top: float
    bottom: float

    @property
    def width(self) -> float:
        return self.right - self.left

    @property
    def height(self) -> float:
        return self.bottom - self.top


@dataclass
class MeasuredItem:
    id: str
    rect: Rect
    data: Optional[Dict[str, Any]] = None


@dataclass
class SafeZone:
    id: str
    left: float      # 0.0 to 1.0 (normalized viewport coordinate)
    right: float     # 0.0 to 1.0
    top: float       # 0.0 to 1.0
    bottom: float    # 0.0 to 1.0
    weight: float    # 0.0 (ignored) to 1.0 (unsuppressed)
    feather_px: float = 60.0


@dataclass
class ScreenConfig:
    anchor_ratio: float = 0.42     # Horizontal gaze line at 42% viewport height
    band_ratio: float = 0.30       # Proximity falloff band radius (30% vh)
    resolve: str = "global"        # 'global' | 'per-column'
    row_split: float = 0.0         # 0.0 = simultaneous, 1.0 = staggered column split


@dataclass
class TouchConfig:
    hold_ms_min: float = 320.0          # Fastest engage time in live zone (ms)
    hold_ms_max: float = 1200.0         # Slowest engage time in suppressed zone (ms)
    drag_deadzone_px: float = 9.0       # Noise jitter threshold (px)
    drag_full_px: float = 46.0          # Full drag intent distance (px)
    vertical_drag_weight: float = 0.22  # Dampening for vertical displacement vs scroll
    scroll_lock_grace_ms: float = 220.0 # Time window for vertical flick detection (ms)
    scroll_lock_axis_ratio: float = 1.3 # |dy| > |dx| * 1.3 classifies gesture as scroll
    engage_at: float = 1.0              # Intent required to lock touch hover (0.0 to 1.0)
    tap_max_ms: float = 180.0           # Maximum duration for click/tap classification (ms)
    tap_max_move_px: float = 10.0       # Maximum movement for click/tap classification (px)
    outer_falloff_px: float = 42.0      # Boundary snap cushion (px)
    in_between_ratio: float = 0.40      # Gutter snap allowance (0.0 to 1.0)
    clear_latch_on_tap: bool = False


@dataclass
class GestureState:
    phase: str          # 'idle' | 'probing' | 'engaged'
    start_x: float
    start_y: float
    x: float
    y: float
    start_time: float   # Milliseconds timestamp
    last_time: float
    end_time: Optional[float]
    zone_weight: float
    zone_id: Optional[str]
    scroll_locked: bool
    down: bool


@dataclass
class HoverHit:
    id: str
    strength: float     # 0.0 to 1.0
    source: str         # 'screen' | 'touch'


def clamp(v: float, lo: float, hi: float) -> float:
    """Clamps a value within [lo, hi]."""
    return min(max(v, lo), hi)


def lerp(a: float, b: float, t: float) -> float:
    """Standard linear interpolation between a and b."""
    return a + (b - a) * t


def smooth(t: float) -> float:
    """
    Cubic Hermite smoothstep curve: S(x) = 3x^2 - 2x^3.
    Provides smooth easing with zero 1st derivatives at boundaries.
    """
    x = clamp(t, 0.0, 1.0)
    return x * x * (3.0 - 2.0 * x)


def dist_to_rect(pt: Point, r: Rect) -> float:
    """
    Computes shortest Euclidean distance from a point to an axis-aligned rectangle.
    Returns 0.0 if the point is inside the rectangle.
    """
    dx = max(0.0, r.left - pt.x, pt.x - r.right)
    dy = max(0.0, r.top - pt.y, pt.y - r.bottom)
    return math.hypot(dx, dy)


def zone_penetration(pt: Point, z: SafeZone, vw: float, vh: float) -> float:
    """
    Calculates how deeply a point penetrates into a safe zone [0.0 to 1.0],
    feathered across the boundary edge to prevent abrupt step changes.
    """
    l = z.left * vw
    r = z.right * vw
    t = z.top * vh
    b = z.bottom * vh
    f = max(1.0, z.feather_px)

    d = min(pt.x - l, r - pt.x, pt.y - t, b - pt.y)
    return smooth((d + f / 2.0) / f)


def sample_zones(pt: Point, zones: List[SafeZone], vw: float, vh: float) -> Tuple[float, Optional[str]]:
    """
    Evaluates resting posture at touchdown point.
    Consulted exclusively at gesture start to avoid false triggers from resting palms/thumbs.
    """
    weight = 1.0
    hit: Optional[str] = None

    for z in zones:
        p = zone_penetration(pt, z, vw, vh)
        if p <= 0.0:
            continue
        w = lerp(1.0, z.weight, p)
        if w < weight:
            weight = w
            hit = z.id

    return weight, hit


def compute_intent(g: GestureState, cfg: TouchConfig, now: float) -> float:
    """
    Dual-channel intent accumulator combining contact dwell (hold) and lateral displacement (drag).
    Suppressed safe zones dynamically stretch hold duration between hold_ms_min and hold_ms_max.
    """
    if g.scroll_locked:
        return 0.0
    if g.zone_weight <= 0.001:
        return 0.0

    # Hold intent
    hold_ms = lerp(cfg.hold_ms_max, cfg.hold_ms_min, g.zone_weight)
    end = g.end_time if g.end_time is not None else now
    elapsed = end - g.start_time
    hold_intent = clamp(elapsed / max(1.0, hold_ms), 0.0, 1.0)

    # Drag intent
    dx = g.x - g.start_x
    dy = g.y - g.start_y
    eff = math.hypot(dx, dy * cfg.vertical_drag_weight)
    drag_span = max(1.0, cfg.drag_full_px - cfg.drag_deadzone_px)
    drag_intent = clamp((eff - cfg.drag_deadzone_px) / drag_span, 0.0, 1.0)

    return clamp(max(hold_intent, drag_intent * g.zone_weight), 0.0, 1.0)


def is_tap(g: GestureState, cfg: TouchConfig) -> bool:
    """Classifies whether gesture is a short click/tap to pass to host app."""
    end = g.end_time if g.end_time is not None else g.last_time
    duration = end - g.start_time
    move = math.hypot(g.x - g.start_x, g.y - g.start_y)
    return duration <= cfg.tap_max_ms and move <= cfg.tap_max_move_px


@dataclass
class RowGroup:
    top: float
    bottom: float
    height: float
    items: List[MeasuredItem]


def group_by_row(items: List[MeasuredItem]) -> List[RowGroup]:
    """Clusters registered items into rows based on vertical bounding box overlap."""
    if not items:
        return []
    sorted_items = sorted(items, key=lambda it: it.rect.top)
    rows: List[RowGroup] = []

    for it in sorted_items:
        match = None
        for r in rows:
            overlap = min(r.bottom, it.rect.bottom) - max(r.top, it.rect.top)
            if overlap > it.rect.height * 0.20:
                match = r
                break

        if match is None:
            rows.append(RowGroup(
                top=it.rect.top,
                bottom=it.rect.bottom,
                height=max(1.0, it.rect.height),
                items=[it]
            ))
        else:
            match.items.append(it)
            match.top = min(match.top, it.rect.top)
            match.bottom = max(match.bottom, it.rect.bottom)
            match.height = max(1.0, match.bottom - match.top)

    for r in rows:
        r.items.sort(key=lambda it: it.rect.left + it.rect.width / 2.0)

    return rows


def resolve_screen(items: List[MeasuredItem], vw: float, vh: float, cfg: ScreenConfig) -> List[HoverHit]:
    """
    Evaluates proximity to horizontal gaze anchor line with smoothstep falloff.
    Optionally staggers multi-column rows via row_split.
    """
    if not items:
        return []
    anchor_y = vh * cfg.anchor_ratio
    band = max(1.0, vh * cfg.band_ratio)
    rows = group_by_row(items)
    out: List[HoverHit] = []

    for row in rows:
        n = len(row.items)
        v = clamp((anchor_y - row.top) / max(1.0, row.height), 0.0, 1.0)
        slice_w = 1.0 / n

        for col_idx, it in enumerate(row.items):
            cy = it.rect.top + it.rect.height / 2.0
            d = abs(cy - anchor_y)
            base_strength = smooth(1.0 - d / band)
            if base_strength <= 0.001:
                continue

            col_weight = 1.0
            if n > 1 and cfg.row_split > 0.0:
                col_center = (col_idx + 0.5) * slice_w
                dist_from_center = abs(v - col_center)
                split_strength = clamp(1.0 - (dist_from_center / slice_w), 0.0, 1.0)
                col_weight = lerp(1.0, split_strength, cfg.row_split)

            final_strength = base_strength * col_weight
            if final_strength > 0.001:
                out.append(HoverHit(id=it.id, strength=final_strength, source="screen"))

    return out


def get_hit_under_point(point: Optional[Point], items: List[MeasuredItem], cfg: TouchConfig) -> Optional[str]:
    """
    Edge-aware touch hit test with outer margin snapping and inter-item gutter deadzones.
    """
    if point is None or not items:
        return None

    # 1. Direct bounding box hit
    for it in items:
        r = it.rect
        if r.left <= point.x <= r.right and r.top <= point.y <= r.bottom:
            return it.id

    # 2. Edge distance measurements
    dists = sorted(
        [{"id": it.id, "d": dist_to_rect(point, it.rect)} for it in items],
        key=lambda x: x["d"]
    )
    closest = dists[0]
    second = dists[1] if len(dists) > 1 else None

    effective_falloff = cfg.outer_falloff_px
    if second is not None:
        gap_span = closest["d"] + second["d"]
        gap_allowance = (gap_span / 2.0) * clamp(cfg.in_between_ratio, 0.0, 1.0)
        effective_falloff = min(cfg.outer_falloff_px, gap_allowance)

    if closest["d"] <= effective_falloff:
        return closest["id"]

    return None


def arbitrate(
    screen_hits: List[HoverHit],
    touch_hit: Optional[HoverHit],
    authority: float,
    screen_enabled: bool = True,
    touch_enabled: bool = True
) -> List[HoverHit]:
    """
    Smoothly crossfades screen anchor hits and touch latched hits by authority weighting.
    """
    results: Dict[str, HoverHit] = {}

    def add(h: Optional[HoverHit], multiplier: float):
        if h is None:
            return
        s = h.strength * multiplier
        if s <= 0.001:
            return
        if h.id not in results or s > results[h.id].strength:
            results[h.id] = HoverHit(id=h.id, strength=s, source=h.source)

    if screen_enabled:
        screen_scale = (1.0 - authority) if touch_enabled else 1.0
        for sh in screen_hits:
            add(sh, screen_scale)

    if touch_enabled and touch_hit is not None:
        add(touch_hit, authority)

    return sorted(results.values(), key=lambda h: h.strength, reverse=True)
