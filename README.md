# HoverSense Core (Lean)

Framework-agnostic mathematical core and pointerless interaction engine for touch interfaces.

This branch contains the lean, unopinionated core of HoverSense. It provides pure geometric modeling, signal processing, intent accumulation, and channel arbitration equations with zero framework dependencies.

> **Looking for the turnkey DOM experience?**
> The [`main`](https://github.com/EaZyStudiio/hoversense/tree/main) branch contains the high-level Developer Experience (`createHoverSenseContainer`, automatic touch hygiene, CSS custom property injection, and discrete DOM attributes). You can also explore the [Live Interactive Playground](https://eazystudiio.github.io/hoversense/playground/).

---

## What is in this Branch

* **Pure Mathematical Core (`src/math.ts`)**: 100% DOM-free functions for geometric distance (`distToRect`), screen gaze horizon proximity (`resolveScreen`), intent accumulation (`computeIntent`), and dual-channel arbitration (`arbitrate`).
* **Pointerless Runtime Engine (`src/engine.ts`)**: Lightweight runtime that coordinates pointer events, scroll monitoring, and safe zone evaluation.
* **Touch Hygiene & CSS Utilities (`src/css.ts`)**: Mobile browser styling helpers (`applyTouchHygiene`, `CssVariableBinder`).
* **Biomechanical Defaults (`src/defaults.ts`)**: Empirically calibrated constants for thumb reach, dwell timing, and safe zones.

---

## Installation

```bash
# npm
npm install hoversense

# pnpm
pnpm add hoversense

# bun
bun add hoversense
```

---

## Getting Started

### 1. Headless Engine Setup

Use `HoverSense` directly when you want full control over DOM elements, bounding boxes, or custom rendering loops:

```ts
import { HoverSense } from 'hoversense';

const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42, // Gaze horizon at 42% of viewport height
    bandRatio: 0.30,   // Proximity falloff band radius
  },
  touch: {
    holdMsMin: 320,    // Minimum hold dwell in live zone
    engageAt: 0.90,    // Intent threshold to lock latch
  },
  arbitration: {
    releaseMode: 'off-screen', // Release lock when item leaves viewport
  },
  modes: {
    screen: true,
    touch: true,
  },
});

// Register DOM elements
document.querySelectorAll('.item').forEach((el, index) => {
  engine.register(`item-${index}`, el);
});

// Or register virtual bounding boxes (Three.js, Canvas, SVG)
engine.register('virtual-node', () => ({
  left: 100,
  right: 250,
  top: 300,
  bottom: 450,
  width: 150,
  height: 150,
}));

// Subscribe to evaluated hover hits
engine.onHover((hits, state, isCleanup) => {
  console.log('Active Hits:', hits);
  if (isCleanup) {
    console.log('Touch released in empty space, gaze resumed');
  }
});
```

### 2. Pure Math Primitives (Zero DOM, Zero Browser APIs)

If you are running in a custom game engine, server environment, or non-browser runtime, import the pure mathematics module directly:

```ts
import {
  resolveScreen,
  arbitrate,
  distToRect,
  computeIntent,
  sampleZones,
} from 'hoversense/math';

// 1. Evaluate screen gaze proximity
const screenHits = resolveScreen(
  items,      // Array of { id, rect: { top, bottom, left, right } }
  windowWidth,
  windowHeight,
  {
    anchorRatio: 0.42,
    bandRatio: 0.30,
    resolve: 'global',
    rowSplit: 0.0,
  }
);

// 2. Arbitrate between screen and touch channels
const finalHits = arbitrate({
  screenHits,
  touchHit: activeTouchHit,
  authority: currentTouchAuthority,
  modes: { screen: true, touch: true },
  isCleanup: false,
});
```

---

## Mathematical Architecture

HoverSense fuses two independent streams of physical interaction:

1. **Screen Channel (Gaze Proximity)**:
   Evaluates vertical proximity of measured items to a virtual horizontal anchor line (default: 42% viewport height) using cubic Hermite smoothstep falloff:
   $$S(x) = 3x^2 - 2x^3 \quad \text{where } x = \text{clamp}\left(1 - \frac{|\text{itemCenterY} - \text{anchorY}|}{\text{bandRadius}}, 0, 1\right)$$

2. **Touch Channel (Intent Accumulator)**:
   Fuses deliberate contact dwell time ($320\text{ms}$ minimum) and lateral drag displacement ($46\text{px}$ saturation). Suppresses capacitive sensor noise ($9\text{px}$ deadzone) and classifies rapid vertical gestures as native scrolling ($220\text{ms}$ grace period).

3. **Biomechanical Safe Zones**:
   Feathered boundary buffers that penalize accidental touch contacts near screen bezels and resting thumb regions ($80\%\text{ to } 100\%$ viewport height).

4. **Channel Arbitration**:
   Dynamically weights authority between passive gaze navigation and active touch latching. When touch engages on a valid target, it takes authority. When touch releases or taps in empty space, gaze immediately reclaims authority.

---

## Testing & Verification

The core test suite verifies all mathematical boundary conditions, inverted rect handling, safe zone gradients, and arbitration edge cases:

```bash
# Run unit test suite
npm test

# Run build
npm run build
```

---

## Live Website Reference

The full interactive website, live demonstrations, and visual parameter playground are hosted at:
* **Interactive Demo**: [https://eazystudiio.github.io/hoversense/](https://eazystudiio.github.io/hoversense/)
* **Playground Source**: Maintained on the [`main`](https://github.com/EaZyStudiio/hoversense/tree/main) branch.

---

## License

MIT License. Copyright (c) 2026 EaZy (EaZyStudiio).
