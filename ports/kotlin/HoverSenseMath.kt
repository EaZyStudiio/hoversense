/**
 * HoverSense Mathematics Core (Kotlin Reference Implementation)
 * Framework-agnostic pointerless interaction model for touch interfaces.
 *
 * Provides pure mathematical models, geometric proximity calculations,
 * intent accumulation, safe zone weights, and channel arbitration.
 */

package studio.eazy.hoversense.math

import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

data class Point(val x: Double, val y: Double)

data class Rect(val left: Double, val right: Double, val top: Double, val bottom: Double) {
    val width: Double get() = right - left
    val height: Double get() = bottom - top
}

data class MeasuredItem(val id: String, val rect: Rect, val data: Map<String, Any>? = null)

data class SafeZone(
    val id: String,
    val left: Double,    // 0.0 to 1.0 (normalized viewport coordinate)
    val right: Double,   // 0.0 to 1.0
    val top: Double,     // 0.0 to 1.0
    val bottom: Double,  // 0.0 to 1.0
    val weight: Double,  // 0.0 (ignored) to 1.0 (unsuppressed)
    val featherPx: Double = 60.0
)

data class ScreenConfig(
    val anchorRatio: Double = 0.42,
    val bandRatio: Double = 0.30,
    val resolve: String = "global",
    val rowSplit: Double = 0.0
)

data class TouchConfig(
    val holdMsMin: Double = 320.0,
    val holdMsMax: Double = 1200.0,
    val dragDeadzonePx: Double = 9.0,
    val dragFullPx: Double = 46.0,
    val verticalDragWeight: Double = 0.22,
    val scrollLockGraceMs: Double = 220.0,
    val scrollLockAxisRatio: Double = 1.3,
    val engageAt: Double = 0.90,
    val tapMaxMs: Double = 180.0,
    val tapMaxMovePx: Double = 10.0,
    val outerFalloffPx: Double = 42.0,
    val inBetweenRatio: Double = 0.40,
    val clearLatchOnTap: Boolean = false
)

data class GestureState(
    val phase: String, // "idle", "probing", "engaged"
    val startX: Double,
    val startY: Double,
    val x: Double,
    val y: Double,
    val startTime: Double,
    val lastTime: Double,
    val endTime: Double?,
    val zoneWeight: Double,
    val zoneId: String?,
    val scrollLocked: Boolean,
    val down: Boolean
)

data class HoverHit(val id: String, val strength: Double, val source: String)

object HoverSenseMath {

    fun clamp(v: Double, lo: Double, hi: Double): Double = min(max(v, lo), hi)

    fun lerp(a: Double, b: Double, t: Double): Double = a + (b - a) * t

    /**
     * Cubic Hermite smoothstep curve: S(x) = 3x^2 - 2x^3.
     */
    fun smooth(t: Double): Double {
        val x = clamp(t, 0.0, 1.0)
        return x * x * (3.0 - 2.0 * x)
    }

    /**
     * Shortest Euclidean distance from a point to an axis-aligned rectangle.
     */
    fun distToRect(pt: Point, r: Rect): Double {
        val dx = max(0.0, max(r.left - pt.x, pt.x - r.right))
        val dy = max(0.0, max(r.top - pt.y, pt.y - r.bottom))
        return hypot(dx, dy)
    }

    /**
     * Calculates feathered safe-zone penetration gradient [0.0 to 1.0].
     */
    fun zonePenetration(pt: Point, z: SafeZone, vw: Double, vh: Double): Double {
        val l = z.left * vw
        val r = z.right * vw
        val t = z.top * vh
        val b = z.bottom * vh
        val f = max(1.0, z.featherPx)

        val d = min(min(pt.x - l, r - pt.x), min(pt.y - t, b - pt.y))
        return smooth((d + f / 2.0) / f)
    }

    /**
     * Evaluates resting palm/thumb posture at touchdown.
     */
    fun sampleZones(pt: Point, zones: List<SafeZone>, vw: Double, vh: Double): Pair<Double, String?> {
        var weight = 1.0
        var hit: String? = null

        for (z in zones) {
            val p = zonePenetration(pt, z, vw, vh)
            if (p <= 0.0) continue
            val w = lerp(1.0, z.weight, p)
            if (w < weight) {
                weight = w
                hit = z.id
            }
        }

        return Pair(weight, hit)
    }

    /**
     * Dual-channel intent accumulator combining contact dwell and lateral travel.
     */
    fun computeIntent(g: GestureState, cfg: TouchConfig, now: Double): Double {
        if (g.scrollLocked || g.zoneWeight <= 0.001) return 0.0

        val holdMs = lerp(cfg.holdMsMax, cfg.holdMsMin, g.zoneWeight)
        val end = g.endTime ?: now
        val elapsed = end - g.startTime
        val holdIntent = clamp(elapsed / max(1.0, holdMs), 0.0, 1.0)

        val dx = g.x - g.startX
        val dy = g.y - g.startY
        val eff = hypot(dx, dy * cfg.verticalDragWeight)
        val dragSpan = max(1.0, cfg.dragFullPx - cfg.dragDeadzonePx)
        val dragIntent = clamp((eff - cfg.dragDeadzonePx) / dragSpan, 0.0, 1.0)

        return clamp(max(holdIntent, dragIntent * g.zoneWeight), 0.0, 1.0)
    }

    fun isTap(g: GestureState, cfg: TouchConfig): Boolean {
        val end = g.endTime ?: g.lastTime
        val duration = end - g.startTime
        val movement = hypot(g.x - g.startX, g.y - g.startY)
        return duration <= cfg.tapMaxMs && movement <= cfg.tapMaxMovePx
    }

    data class RowGroup(
        var top: Double,
        var bottom: Double,
        var height: Double,
        val items: MutableList<MeasuredItem>
    )

    fun groupByRow(items: List<MeasuredItem>): List<RowGroup> {
        if (items.isEmpty()) return emptyList()
        val sorted = items.sortedBy { it.rect.top }
        val rows = mutableListOf<RowGroup>()

        for (it in sorted) {
            val matching = rows.find { r ->
                val overlap = min(r.bottom, it.rect.bottom) - max(r.top, it.rect.top)
                overlap > it.rect.height * 0.20
            }

            if (matching == null) {
                rows.add(RowGroup(it.rect.top, it.rect.bottom, max(1.0, it.rect.height), mutableListOf(it)))
            } else {
                matching.items.add(it)
                matching.top = min(matching.top, it.rect.top)
                matching.bottom = max(matching.bottom, it.rect.bottom)
                matching.height = max(1.0, matching.bottom - matching.top)
            }
        }

        for (r in rows) {
            r.items.sortBy { it.rect.left + it.rect.width / 2.0 }
        }

        return rows
    }

    fun resolveScreen(items: List<MeasuredItem>, vw: Double, vh: Double, cfg: ScreenConfig): List<HoverHit> {
        if (items.isEmpty()) return emptyList()
        val anchorY = vh * cfg.anchorRatio
        val band = max(1.0, vh * cfg.bandRatio)
        val rows = groupByRow(items)
        val out = mutableListOf<HoverHit>()

        for (row in rows) {
            val n = row.items.size
            val v = clamp((anchorY - row.top) / max(1.0, row.height), 0.0, 1.0)
            val sliceW = 1.0 / n

            row.items.forEachIndexed { colIdx, it ->
                val cy = it.rect.top + it.rect.height / 2.0
                val d = abs(cy - anchorY)
                val baseStrength = smooth(1.0 - d / band)
                if (baseStrength > 0.001) {
                    var colWeight = 1.0
                    if (n > 1 && cfg.rowSplit > 0.0) {
                        val colCenter = (colIdx + 0.5) * sliceW
                        val distFromCenter = abs(v - colCenter)
                        val splitStrength = clamp(1.0 - (distFromCenter / sliceW), 0.0, 1.0)
                        colWeight = lerp(1.0, splitStrength, cfg.rowSplit)
                    }
                    val finalStrength = baseStrength * colWeight
                    if (finalStrength > 0.001) {
                        out.add(HoverHit(it.id, finalStrength, "screen"))
                    }
                }
            }
        }

        return out
    }

    fun getHitUnderPoint(point: Point?, items: List<MeasuredItem>, cfg: TouchConfig): String? {
        if (point == null || items.isEmpty()) return null

        for (it in items) {
            val r = it.rect
            if (point.x in r.left..r.right && point.y in r.top..r.bottom) {
                return it.id
            }
        }

        val dists = items.map { Pair(it.id, distToRect(point, it.rect)) }.sortedBy { it.second }
        val closest = dists[0]
        val second = if (dists.size > 1) dists[1] else null

        var effectiveFalloff = cfg.outerFalloffPx
        if (second != null) {
            val gapSpan = closest.second + second.second
            val gapAllowance = (gapSpan / 2.0) * clamp(cfg.inBetweenRatio, 0.0, 1.0)
            effectiveFalloff = min(cfg.outerFalloffPx, gapAllowance)
        }

        if (closest.second <= effectiveFalloff) {
            return closest.first
        }

        return null
    }

    fun arbitrate(
        screenHits: List<HoverHit>,
        touchHit: HoverHit?,
        authority: Double,
        screenEnabled: Boolean = true,
        touchEnabled: Boolean = true
    ): List<HoverHit> {
        val map = mutableMapOf<String, HoverHit>()

        fun add(h: HoverHit?, multiplier: Double) {
            if (h == null) return
            val s = h.strength * multiplier
            if (s <= 0.001) return
            val prev = map[h.id]
            if (prev == null || s > prev.strength) {
                map[h.id] = HoverHit(h.id, s, h.source)
            }
        }

        if (screenEnabled) {
            val screenScale = if (touchEnabled) 1.0 - authority else 1.0
            screenHits.forEach { add(it, screenScale) }
        }

        if (touchEnabled && touchHit != null) {
            add(touchHit, authority)
        }

        return map.values.sortedByDescending { it.strength }
    }
}
