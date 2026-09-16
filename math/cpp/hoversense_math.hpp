/**
 * HoverSense Mathematics Core (C++ Reference Implementation)
 * Framework-agnostic pointerless interaction model for touch interfaces.
 *
 * Header-only C++17/C++20 mathematical foundation.
 */

#pragma once

#include <cmath>
#include <algorithm>
#include <string>
#include <vector>
#include <optional>
#include <unordered_map>

namespace hoversense {

struct Point {
    double x{0.0};
    double y{0.0};
};

struct Rect {
    double left{0.0};
    double right{0.0};
    double top{0.0};
    double bottom{0.0};

    [[nodiscard]] double width() const { return right - left; }
    [[nodiscard]] double height() const { return bottom - top; }
};

struct MeasuredItem {
    std::string id;
    Rect rect;
};

struct SafeZone {
    std::string id;
    double left{0.0};     // 0.0 to 1.0 (normalized viewport coordinate)
    double right{1.0};
    double top{0.0};
    double bottom{1.0};
    double weight{1.0};   // 0.0 (suppressed) to 1.0 (unsuppressed)
    double featherPx{60.0};
};

struct ScreenConfig {
    double anchorRatio{0.42};
    double bandRatio{0.30};
    std::string resolve{"global"};
    double rowSplit{0.0};
};

struct TouchConfig {
    double holdMsMin{320.0};
    double holdMsMax{1200.0};
    double dragDeadzonePx{9.0};
    double dragFullPx{46.0};
    double verticalDragWeight{0.22};
    double scrollLockGraceMs{220.0};
    double scrollLockAxisRatio{1.3};
    double engageAt{1.0};
    double tapMaxMs{180.0};
    double tapMaxMovePx{10.0};
    double outerFalloffPx{42.0};
    double inBetweenRatio{0.40};
    bool clearLatchOnTap{false};
};

struct GestureState {
    std::string phase{"idle"}; // "idle", "probing", "engaged"
    double startX{0.0};
    double startY{0.0};
    double x{0.0};
    double y{0.0};
    double startTime{0.0};
    double lastTime{0.0};
    std::optional<double> endTime{std::nullopt};
    double zoneWeight{1.0};
    std::optional<std::string> zoneId{std::nullopt};
    bool scrollLocked{false};
    bool down{false};
};

struct HoverHit {
    std::string id;
    double strength{0.0};
    std::string source; // "screen" or "touch"
};

inline double clamp(double v, double lo, double hi) {
    return std::min(std::max(v, lo), hi);
}

inline double lerp(double a, double b, double t) {
    return a + (b - a) * t;
}

/**
 * Cubic Hermite smoothstep curve: S(x) = 3x^2 - 2x^3.
 */
inline double smooth(double t) {
    const double x = clamp(t, 0.0, 1.0);
    return x * x * (3.0 - 2.0 * x);
}

/**
 * Shortest Euclidean distance from point to axis-aligned rectangle.
 */
inline double distToRect(const Point& pt, const Rect& r) {
    const double dx = std::max({0.0, r.left - pt.x, pt.x - r.right});
    const double dy = std::max({0.0, r.top - pt.y, pt.y - r.bottom});
    return std::hypot(dx, dy);
}

inline double zonePenetration(const Point& pt, const SafeZone& z, double vw, double vh) {
    const double l = z.left * vw;
    const double r = z.right * vw;
    const double t = z.top * vh;
    const double b = z.bottom * vh;
    const double f = std::max(1.0, z.featherPx);

    const double d = std::min({pt.x - l, r - pt.x, pt.y - t, b - pt.y});
    return smooth((d + f / 2.0) / f);
}

inline std::pair<double, std::optional<std::string>> sampleZones(
    const Point& pt,
    const std::vector<SafeZone>& zones,
    double vw,
    double vh
) {
    double weight = 1.0;
    std::optional<std::string> hit = std::nullopt;

    for (const auto& z : zones) {
        const double p = zonePenetration(pt, z, vw, vh);
        if (p <= 0.0) continue;
        const double w = lerp(1.0, z.weight, p);
        if (w < weight) {
            weight = w;
            hit = z.id;
        }
    }

    return {weight, hit};
}

inline double computeIntent(const GestureState& g, const TouchConfig& cfg, double now) {
    if (g.scrollLocked || g.zoneWeight <= 0.001) return 0.0;

    const double holdMs = lerp(cfg.holdMsMax, cfg.holdMsMin, g.zoneWeight);
    const double end = g.endTime.value_or(now);
    const double elapsed = end - g.startTime;
    const double holdIntent = clamp(elapsed / std::max(1.0, holdMs), 0.0, 1.0);

    const double dx = g.x - g.startX;
    const double dy = g.y - g.startY;
    const double eff = std::hypot(dx, dy * cfg.verticalDragWeight);
    const double dragSpan = std::max(1.0, cfg.dragFullPx - cfg.dragDeadzonePx);
    const double dragIntent = clamp((eff - cfg.dragDeadzonePx) / dragSpan, 0.0, 1.0);

    return clamp(std::max(holdIntent, dragIntent * g.zoneWeight), 0.0, 1.0);
}

inline bool isTap(const GestureState& g, const TouchConfig& cfg) {
    const double end = g.endTime.value_or(g.lastTime);
    const double duration = end - g.startTime;
    const double movement = std::hypot(g.x - g.startX, g.y - g.startY);
    return duration <= cfg.tapMaxMs && movement <= cfg.tapMaxMovePx;
}

inline std::vector<HoverHit> arbitrate(
    const std::vector<HoverHit>& screenHits,
    const std::optional<HoverHit>& touchHit,
    double authority,
    bool screenEnabled = true,
    bool touchEnabled = true
) {
    std::unordered_map<std::string, HoverHit> map;

    auto addHit = [&](const HoverHit& h, double multiplier) {
        const double s = h.strength * multiplier;
        if (s <= 0.001) return;
        auto it = map.find(h.id);
        if (it == map.end() || s > it->second.strength) {
            map[h.id] = HoverHit{h.id, s, h.source};
        }
    };

    if (screenEnabled) {
        const double screenScale = touchEnabled ? (1.0 - authority) : 1.0;
        for (const auto& sh : screenHits) {
            addHit(sh, screenScale);
        }
    }

    if (touchEnabled && touchHit.has_value()) {
        addHit(touchHit.value(), authority);
    }

    std::vector<HoverHit> out;
    out.reserve(map.size());
    for (auto& [_, v] : map) out.push_back(v);

    std::sort(out.begin(), out.end(), [](const HoverHit& a, const HoverHit& b) {
        return a.strength > b.strength;
    });

    return out;
}

} // namespace hoversense
