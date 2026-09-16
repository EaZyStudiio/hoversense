/**
 * HoverSense Mathematics Core (Java Reference Implementation)
 * Framework-agnostic pointerless interaction model for touch interfaces.
 *
 * Provides pure mathematical models, proximity geometry,
 * intent accumulation, safe-zone weighting, and channel arbitration.
 */

package studio.eazy.hoversense.math;

import java.util.*;

public final class HoverSenseMath {

    private HoverSenseMath() {}

    public static class Point {
        public final double x, y;
        public Point(double x, double y) { this.x = x; this.y = y; }
    }

    public static class Rect {
        public final double left, right, top, bottom;
        public Rect(double left, double right, double top, double bottom) {
            this.left = left; this.right = right; this.top = top; this.bottom = bottom;
        }
        public double getWidth() { return right - left; }
        public double getHeight() { return bottom - top; }
    }

    public static class MeasuredItem {
        public final String id;
        public final Rect rect;
        public final Map<String, Object> data;
        public MeasuredItem(String id, Rect rect) { this(id, rect, null); }
        public MeasuredItem(String id, Rect rect, Map<String, Object> data) {
            this.id = id; this.rect = rect; this.data = data;
        }
    }

    public static class SafeZone {
        public final String id;
        public final double left, right, top, bottom; // 0.0 to 1.0
        public final double weight; // 0.0 to 1.0
        public final double featherPx;

        public SafeZone(String id, double left, double right, double top, double bottom, double weight, double featherPx) {
            this.id = id; this.left = left; this.right = right;
            this.top = top; this.bottom = bottom; this.weight = weight;
            this.featherPx = featherPx;
        }
    }

    public static class ScreenConfig {
        public double anchorRatio = 0.42;
        public double bandRatio = 0.30;
        public String resolve = "global";
        public double rowSplit = 0.0;
    }

    public static class TouchConfig {
        public double holdMsMin = 320.0;
        public double holdMsMax = 1200.0;
        public double dragDeadzonePx = 9.0;
        public double dragFullPx = 46.0;
        public double verticalDragWeight = 0.22;
        public double scrollLockGraceMs = 220.0;
        public double scrollLockAxisRatio = 1.3;
        public double engageAt = 1.0;
        public double tapMaxMs = 180.0;
        public double tapMaxMovePx = 10.0;
        public double outerFalloffPx = 42.0;
        public double inBetweenRatio = 0.40;
        public boolean clearLatchOnTap = false;
    }

    public static class GestureState {
        public String phase; // "idle", "probing", "engaged"
        public double startX, startY, x, y;
        public double startTime, lastTime;
        public Double endTime;
        public double zoneWeight;
        public String zoneId;
        public boolean scrollLocked;
        public boolean down;
    }

    public static class HoverHit {
        public final String id;
        public final double strength;
        public final String source;
        public HoverHit(String id, double strength, String source) {
            this.id = id; this.strength = strength; this.source = source;
        }
    }

    public static double clamp(double v, double lo, double hi) {
        return Math.min(Math.max(v, lo), hi);
    }

    public static double lerp(double a, double b, double t) {
        return a + (b - a) * t;
    }

    /**
     * Cubic Hermite smoothstep curve: S(x) = 3x^2 - 2x^3.
     */
    public static double smooth(double t) {
        double x = clamp(t, 0.0, 1.0);
        return x * x * (3.0 - 2.0 * x);
    }

    /**
     * Shortest Euclidean distance from point to axis-aligned rectangle.
     */
    public static double distToRect(Point pt, Rect r) {
        double dx = Math.max(0.0, Math.max(r.left - pt.x, pt.x - r.right));
        double dy = Math.max(0.0, Math.max(r.top - pt.y, pt.y - r.bottom));
        return Math.hypot(dx, dy);
    }

    public static double zonePenetration(Point pt, SafeZone z, double vw, double vh) {
        double l = z.left * vw;
        double r = z.right * vw;
        double t = z.top * vh;
        double b = z.bottom * vh;
        double f = Math.max(1.0, z.featherPx);

        double d = Math.min(Math.min(pt.x - l, r - pt.x), Math.min(pt.y - t, b - pt.y));
        return smooth((d + f / 2.0) / f);
    }

    public static double computeIntent(GestureState g, TouchConfig cfg, double now) {
        if (g.scrollLocked || g.zoneWeight <= 0.001) return 0.0;

        double holdMs = lerp(cfg.holdMsMax, cfg.holdMsMin, g.zoneWeight);
        double end = (g.endTime != null) ? g.endTime : now;
        double elapsed = end - g.startTime;
        double holdIntent = clamp(elapsed / Math.max(1.0, holdMs), 0.0, 1.0);

        double dx = g.x - g.startX;
        double dy = g.y - g.startY;
        double eff = Math.hypot(dx, dy * cfg.verticalDragWeight);
        double dragSpan = Math.max(1.0, cfg.dragFullPx - cfg.dragDeadzonePx);
        double dragIntent = clamp((eff - cfg.dragDeadzonePx) / dragSpan, 0.0, 1.0);

        return clamp(Math.max(holdIntent, dragIntent * g.zoneWeight), 0.0, 1.0);
    }

    public static boolean isTap(GestureState g, TouchConfig cfg) {
        double end = (g.endTime != null) ? g.endTime : g.lastTime;
        double duration = end - g.startTime;
        double move = Math.hypot(g.x - g.startX, g.y - g.startY);
        return duration <= cfg.tapMaxMs && move <= cfg.tapMaxMovePx;
    }

    public static List<HoverHit> arbitrate(
        List<HoverHit> screenHits,
        HoverHit touchHit,
        double authority,
        boolean screenEnabled,
        boolean touchEnabled
    ) {
        Map<String, HoverHit> map = new HashMap<>();

        if (screenEnabled) {
            double screenScale = touchEnabled ? (1.0 - authority) : 1.0;
            for (HoverHit sh : screenHits) {
                double s = sh.strength * screenScale;
                if (s > 0.001) {
                    HoverHit existing = map.get(sh.id);
                    if (existing == null || s > existing.strength) {
                        map.put(sh.id, new HoverHit(sh.id, s, sh.source));
                    }
                }
            }
        }

        if (touchEnabled && touchHit != null) {
            double s = touchHit.strength * authority;
            if (s > 0.001) {
                HoverHit existing = map.get(touchHit.id);
                if (existing == null || s > existing.strength) {
                    map.put(touchHit.id, new HoverHit(touchHit.id, s, touchHit.source));
                }
            }
        }

        List<HoverHit> list = new ArrayList<>(map.values());
        list.sort((a, b) -> Double.compare(b.strength, a.strength));
        return list;
    }
}
