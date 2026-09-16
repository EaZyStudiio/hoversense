//! HoverSense Mathematics Core (Rust Reference Implementation)
//! Framework-agnostic pointerless interaction model for touch interfaces.
//!
//! Pure mathematical models, geometric proximity equations,
//! intent accumulation, biomechanical safe-zone vectors, and channel arbitration.

use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Rect {
    pub left: f64,
    pub right: f64,
    pub top: f64,
    pub bottom: f64,
}

impl Rect {
    pub fn width(&self) -> f64 {
        self.right - self.left
    }

    pub fn height(&self) -> f64 {
        self.bottom - self.top
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct MeasuredItem {
    pub id: String,
    pub rect: Rect,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SafeZone {
    pub id: String,
    pub left: f64,      // 0.0 to 1.0 (normalized viewport coordinate)
    pub right: f64,     // 0.0 to 1.0
    pub top: f64,       // 0.0 to 1.0
    pub bottom: f64,    // 0.0 to 1.0
    pub weight: f64,    // 0.0 (suppressed) to 1.0 (unsuppressed)
    pub feather_px: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ScreenConfig {
    pub anchor_ratio: f64,
    pub band_ratio: f64,
    pub resolve: String,
    pub row_split: f64,
}

impl Default for ScreenConfig {
    fn default() -> Self {
        Self {
            anchor_ratio: 0.42,
            band_ratio: 0.30,
            resolve: "global".to_string(),
            row_split: 0.0,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct TouchConfig {
    pub hold_ms_min: f64,
    pub hold_ms_max: f64,
    pub drag_deadzone_px: f64,
    pub drag_full_px: f64,
    pub vertical_drag_weight: f64,
    pub scroll_lock_grace_ms: f64,
    pub scroll_lock_axis_ratio: f64,
    pub engage_at: f64,
    pub tap_max_ms: f64,
    pub tap_max_move_px: f64,
    pub outer_falloff_px: f64,
    pub in_between_ratio: f64,
    pub clear_latch_on_tap: bool,
}

impl Default for TouchConfig {
    fn default() -> Self {
        Self {
            hold_ms_min: 320.0,
            hold_ms_max: 1200.0,
            drag_deadzone_px: 9.0,
            drag_full_px: 46.0,
            vertical_drag_weight: 0.22,
            scroll_lock_grace_ms: 220.0,
            scroll_lock_axis_ratio: 1.3,
            engage_at: 0.90,
            tap_max_ms: 180.0,
            tap_max_move_px: 10.0,
            outer_falloff_px: 42.0,
            in_between_ratio: 0.40,
            clear_latch_on_tap: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct GestureState {
    pub phase: String, // "idle", "probing", "engaged"
    pub start_x: f64,
    pub start_y: f64,
    pub x: f64,
    pub y: f64,
    pub start_time: f64,
    pub last_time: f64,
    pub end_time: Option<f64>,
    pub zone_weight: f64,
    pub zone_id: Option<String>,
    pub scroll_locked: bool,
    pub down: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct HoverHit {
    pub id: String,
    pub strength: f64,
    pub source: String,
}

#[inline]
pub fn clamp(v: f64, lo: f64, hi: f64) -> f64 {
    v.max(lo).min(hi)
}

#[inline]
pub fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

/// Cubic Hermite smoothstep curve: S(x) = 3x^2 - 2x^3.
#[inline]
pub fn smooth(t: f64) -> f64 {
    const ZERO: f64 = 0.0;
    const ONE: f64 = 1.0;
    let x = clamp(t, ZERO, ONE);
    x * x * (3.0 - 2.0 * x)
}

/// Shortest Euclidean distance from point to axis-aligned rectangle.
pub fn dist_to_rect(pt: Point, r: Rect) -> f64 {
    let dx = (r.left - pt.x).max(pt.x - r.right).max(0.0);
    let dy = (r.top - pt.y).max(pt.y - r.bottom).max(0.0);
    dx.hypot(dy)
}

pub fn zone_penetration(pt: Point, z: &SafeZone, vw: f64, vh: f64) -> f64 {
    let l = z.left * vw;
    let r = z.right * vw;
    let t = z.top * vh;
    let b = z.bottom * vh;
    let f = z.feather_px.max(1.0);

    let d = (pt.x - l)
        .min(r - pt.x)
        .min(pt.y - t)
        .min(b - pt.y);

    smooth((d + f / 2.0) / f)
}

pub fn sample_zones(pt: Point, zones: &[SafeZone], vw: f64, vh: f64) -> (f64, Option<String>) {
    let mut weight = 1.0;
    let mut hit = None;

    for z in zones {
        let p = zone_penetration(pt, z, vw, vh);
        if p <= 0.0 {
            continue;
        }
        let w = lerp(1.0, z.weight, p);
        if w < weight {
            weight = w;
            hit = Some(z.id.clone());
        }
    }

    (weight, hit)
}

pub fn compute_intent(g: &GestureState, cfg: &TouchConfig, now: f64) -> f64 {
    if g.scroll_locked || g.zone_weight <= 0.001 {
        return 0.0;
    }

    let hold_ms = lerp(cfg.hold_ms_max, cfg.hold_ms_min, g.zone_weight);
    let end = g.end_time.unwrap_or(now);
    let elapsed = end - g.start_time;
    let hold_intent = clamp(elapsed / hold_ms.max(1.0), 0.0, 1.0);

    let dx = g.x - g.start_x;
    let dy = g.y - g.start_y;
    let eff = dx.hypot(dy * cfg.vertical_drag_weight);
    let drag_span = (cfg.drag_full_px - cfg.drag_deadzone_px).max(1.0);
    let drag_intent = clamp((eff - cfg.drag_deadzone_px) / drag_span, 0.0, 1.0);

    clamp(hold_intent.max(drag_intent * g.zone_weight), 0.0, 1.0)
}

pub fn is_tap(g: &GestureState, cfg: &TouchConfig) -> bool {
    let end = g.end_time.unwrap_or(g.last_time);
    let duration = end - g.start_time;
    let movement = (g.x - g.start_x).hypot(g.y - g.start_y);
    duration <= cfg.tap_max_ms && movement <= cfg.tap_max_move_px
}

pub fn arbitrate(
    screen_hits: &[HoverHit],
    touch_hit: Option<&HoverHit>,
    authority: f64,
    screen_enabled: bool,
    touch_enabled: bool,
) -> Vec<HoverHit> {
    let mut map: HashMap<String, HoverHit> = HashMap::new();

    let mut add_hit = |h: &HoverHit, multiplier: f64| {
        let s = h.strength * multiplier;
        if s <= 0.001 {
            return;
        }
        match map.get(&h.id) {
            Some(existing) if existing.strength >= s => {}
            _ => {
                map.insert(h.id.clone(), HoverHit { id: h.id.clone(), strength: s, source: h.source.clone() });
            }
        }
    };

    if screen_enabled {
        let screen_scale = if touch_enabled { 1.0 - authority } else { 1.0 };
        for sh in screen_hits {
            add_hit(sh, screen_scale);
        }
    }

    if touch_enabled {
        if let Some(th) = touch_hit {
            add_hit(th, authority);
        }
    }

    let mut out: Vec<HoverHit> = map.into_values().collect();
    out.sort_by(|a, b| b.strength.partial_cmp(&a.strength).unwrap_or(std::cmp::Ordering::Equal));
    out
}
