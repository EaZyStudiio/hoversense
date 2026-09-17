# HoverSense

HoverSense is a framework-agnostic pointerless interaction library for touch interfaces.

It lets interfaces respond to where a user is looking, touching, holding, dragging, and scrolling without requiring the user to learn a new gesture.

[Live Interactive Demo](https://eazystudiio.github.io/hoversense/) | [⚡ DX Live Playground](https://eazystudiio.github.io/hoversense/playground/) | [Developer Handbook](docs/DEVELOPER_GUIDE.md) | [DX Edge-Case Analysis](docs/DX_ANALYSIS.md) | [Mathematical Specification](docs/SPECIFICATION.md)

### 1-Line Turnkey Setup

```ts
import { createHoverSenseContainer } from 'hoversense';
import 'hoversense/dist/hoversense.css';

// Automatically configures touch hygiene, discovers items, binds CSS variables, and renders feedback
const controller = createHoverSenseContainer('#my-cards', {
  itemSelector: '.card',
  feedback: true,
});
```

### Headless Engine Setup

```ts
import { HoverSense } from 'hoversense';

const hover = new HoverSense({
  screen: { anchorRatio: 0.42, bandRatio: 0.30 },
  touch: { holdMsMin: 320, engageAt: 0.90 },
  bindCssVariables: true,
});

// Register any DOM element, ref, or dynamic bounding rect
document.querySelectorAll('.card').forEach((el, index) => {
  hover.register(`card-${index}`, el);
});


// Listen to spatial hover changes
hover.onHover((hits) => {
  hits.forEach(hit => {
    console.log(`Target: ${hit.id}, Strength: ${hit.strength.toFixed(2)}, Source: ${hit.source}`);
  });
});
```

```kotlin
// Android (Jetpack Compose / Kotlin)
val hitTarget = HoverSenseMath.getHitUnderPoint(touchPoint, registeredItems, touchConfig)
val intent = HoverSenseMath.computeIntent(gestureState, touchConfig, System.currentTimeMillis().toDouble())
```

```swift
// iOS (SwiftUI / UIKit)
let hits = HoverSenseMath.resolveScreen(items: items, height: viewHeight, config: screenConfig)
```

> **The goal is not to teach users another interaction pattern. It is to make the interface feel like it already understands them.**

---

## Conceptual Taxonomy

- **HoverSense**: The library and runtime engine you install.
- **Pointerless interaction**: The category and physical UX problem (touchscreens have no continuous cursor).
- **Spatial hover**: The underlying interaction model and physics (viewport gaze anchor, proximity falloff, intent accumulation, and latch arbitration).

---

## Live Mobile Experience

To experience spatial hover in your hand, open the interactive demo on a physical phone:

**https://eazystudiio.github.io/hoversense/**

The demo supports:
- 1 x 10 single-column list
- 2 x 5 offset two-column layout
- 3 x 3 responsive grid
- Real-time HUD and debug overlays
- Dynamic tuning sliders for all mathematical parameters

---

## Installation & Distribution

### 1. Package Managers

```bash
# npm
npm install hoversense

# pnpm
pnpm add hoversense

# yarn
yarn add hoversense

# bun
bun add hoversense
```

### 2. Browser CDN (Zero Build Steps)

Modern ES Module:
```html
<script type="module">
  import { HoverSense } from 'https://unpkg.com/hoversense/dist/hoversense.es.js';
  const hover = new HoverSense();
</script>
```

Classical Script Tag (sets `window.HoverSense`):
```html
<script src="https://unpkg.com/hoversense/dist/hoversense.iife.js"></script>
<script>
  const hover = new HoverSense.HoverSense();
</script>
```

### 3. Manual Copy-Paste Drop-In

Copy [`src/math.ts`](src/math.ts) and [`src/engine.ts`](src/engine.ts) directly into your repository. There are zero external dependencies.

Detailed guides for React, Vue 3, Svelte, and Angular are available in [docs/INTEGRATION.md](docs/INTEGRATION.md).

---

## Architecture & Physics

HoverSense decouples passive visual focus from active touch gestures through dual-channel arbitration:

1. **Screen Channel (Gaze Anchor)**: Focuses content aligned with natural reading gaze (42% from top of viewport) with smooth cubic Hermite falloff.
2. **Touch Channel (Intent Accumulator)**: Fuses dwell dwell-time ($320\text{ms}$ minimum) and lateral drag displacement ($46\text{px}$ saturation). Suppresses capacitive sensor jitter ($9\text{px}$ deadzone) and classifies rapid vertical flicks as native scrolls ($220\text{ms}$ grace window).
3. **Biomechanical Safe Zones**: Feathered peripheral filters that suppress resting thumbs ($80\%\text{--}100\%$ viewport height), holding palms, and system back-swipe gesture edges.
4. **Channel Arbitration**: Smoothly crossfades between screen focus and touch latching. When touch engages, it locks authority until the user scrolls the element off-screen or exceeds takeover scroll distance.

Complete formulas, proofs, and edge-case guarantees are documented in [docs/SPECIFICATION.md](docs/SPECIFICATION.md).

---

## Native Platform Ports

For non-web native platforms, standalone implementations of the HoverSense math core are available under [`ports/`](ports/):

| Platform / Language | Directory | Use Cases |
| :--- | :--- | :--- |
| **Android / Kotlin** | [`ports/kotlin`](ports/kotlin/) | Jetpack Compose, Android Views |
| **Java** | [`ports/java`](ports/java/) | Android API 21+, JVM |
| **Python** | [`ports/python`](ports/python/) | Data analysis, PyGame, ML simulation |
| **C++** | [`ports/cpp`](ports/cpp/) | Unreal Engine, game HUDs, embedded Qt |
| **Rust** | [`ports/rust`](ports/rust/) | Native apps, Bevy, WebAssembly |

---

## Configuration Reference

```ts
import { HoverSense } from 'hoversense';

const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42,       // Anchor line position (fraction of viewport height)
    bandRatio: 0.30,         // Falloff band radius
    resolve: 'all',          // 'all' (continuous gradient) or 'global' (single winner)
    rowSplit: 0.0            // 0.0: all cols hover; 1.0: vertical column staggering
  },
  touch: {
    holdMsMin: 320,          // Minimum hold duration to engage (ms)
    holdMsMax: 1200,         // Maximum hold duration in suppressed zones (ms)
    dragDeadzonePx: 9,       // Capacitive jitter filter (px)
    dragFullPx: 46,          // Distance to reach full drag intent (px)
    verticalDragWeight: 0.22,// Dampening for vertical displacement
    scrollLockGraceMs: 220,  // Time window for vertical scroll flick detection
    scrollLockAxisRatio: 1.3,// |dy| / |dx| ratio to classify scroll gesture
    engageAt: 1.0,           // Intent threshold required to lock hover
    outerFalloffPx: 42,      // Proximity snap cushion outside items (px)
    inBetweenRatio: 0.40,    // Gutter snap ratio (0.0 = deadzone, 1.0 = full snap)
    clearLatchOnTap: false   // Clear touch latch on subsequent tap
  },
  arbitration: {
    takeoverStartPx: 180,    // Scroll distance before touch authority decays
    takeoverFullPx: 560,     // Scroll distance for complete screen takeover
    releaseMode: 'off-screen'// 'off-screen', 'scroll', or 'never'
  }
});
```

---

## License

MIT License (c) EaZy (https://github.com/EaZyStudiio)
