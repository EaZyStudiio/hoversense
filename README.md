# HoverSense

Turnkey pointerless interaction engine for modern touch interfaces.

Touchscreens do not have a continuous hover cursor. HoverSense bridges this physical gap by turning vertical reading gaze and deliberate touch intent into smooth, hardware-accelerated spatial hover.

Mount in three lines with zero framework re-renders, or use the low-level engine API directly for custom spatial pipelines.

[⚡ Live Playground](https://eazystudiio.github.io/hoversense/playground/) | [📱 Mobile Demo](https://eazystudiio.github.io/hoversense/) | [Architecture Dossier](docs/DX_ANALYSIS.md) | [Core Math Branch (Lean)](https://github.com/EaZyStudiio/hoversense/tree/lean)

---

## 3-Line Turnkey Quickstart

No gesture listeners, no animation queues, no frame loops. One container helper wires up touch hygiene, auto-measures targets, and streams hardware-accelerated CSS custom properties directly to the GPU:

```ts
import { createHoverSenseContainer } from 'hoversense';
import 'hoversense/dist/hoversense.css';

// Mount on any container element or selector
const controller = createHoverSenseContainer('#card-grid', {
  itemSelector: '.card',
});
```

---

## Zero Virtual DOM Re-renders (CSS Engine)

HoverSense bypasses the JavaScript framework re-render lifecycle completely during 60fps scrolling. It injects CSS custom properties and data attributes directly onto DOM nodes:

```css
.card {
  /* Modern independent scale property powered by HoverSense */
  scale: var(--hs-scale, 1);
  opacity: calc(0.75 + var(--hs-strength, 0) * 0.25);
  transition: box-shadow 150ms ease;
}

/* Discrete DOM subtree reveal without virtual DOM churn */
.card .preview-popup {
  display: none;
}

.card[data-hs-engaged="true"] .preview-popup {
  display: block;
}
```

### Injected Variables and Attributes

| Token | Type | Description |
| :--- | :--- | :--- |
| `--hs-strength` | CSS Variable | Continuous proximity strength (`0.000` to `1.000`). |
| `--hs-scale` | CSS Variable | Pre-calculated scale multiplier (`1.000` to `1.050`). |
| `--hs-translate-y` | CSS Variable | Subtle lift displacement (`0px` to `-2px`). |
| `--hs-source` | CSS Variable | Active channel (`screen`, `touch`, or `idle`). |
| `data-hs-hover` | Attribute | Set to `active` when item has non-zero proximity. |
| `data-hs-engaged` | Attribute | Set to `true` when strength reaches threshold (default: `0.75`). |

---

## Solved Out of the Box

1. **Conditional DOM Gating (`data-hs-engaged`)**:
   CSS variables run on the GPU compositor and cannot mount heavy DOM nodes. HoverSense automatically toggles `data-hs-engaged="true"` at a configurable threshold (`engageThreshold: 0.75`), allowing CSS attribute selectors to reveal preview popups without downloading heavy assets upfront.

2. **GSAP & Imperative Animation Decoupling**:
   HoverSense binds modern independent transform properties (`scale`, `translate`) rather than overwriting monolithic `transform`. Imperative animation libraries like GSAP can animate element coordinates without colliding with spatial hover scaling.

3. **Automatic Staggered Rack Splitting (`resolve: 'auto'`)**:
   In asymmetric multi-column layouts, items cross the gaze horizon at different scroll offsets. With `resolve: 'auto'`, the engine inspects geometric bounds and automatically engages independent column crossfading (`rowSplit = 1.0`).

4. **Scroll-Flick Dwell Filter (`dwellThresholdMs`)**:
   Rapid vertical flick gestures are classified as native scrolling, preventing brief 16ms popup flashes across intermediate items. Popups only engage when gaze dwells on a target.

5. **Automated Touch Hygiene**:
   Injects native `touch-action: pan-y`, eliminates the 300ms mobile tap delay, and suppresses unwanted iOS text selection callouts.

---

## Headless API (Custom Pipelines)

For custom React state hooks, canvas overlays, or analytics, instantiate the headless engine:

```ts
import { HoverSense } from 'hoversense';

const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42,
    bandRatio: 0.30,
    resolve: 'auto',
  },
  touch: {
    holdMsMin: 320,
    engageAt: 0.90,
  },
  arbitration: {
    dwellThresholdMs: 80,
    releaseMode: 'off-screen',
  },
});

// Register elements
document.querySelectorAll('.card').forEach((el, index) => {
  engine.register(`card-${index}`, el);
});

// Subscribe to state
engine.onHover((hits, state) => {
  console.log('Top Hit:', hits[0]);
});
```

---

## Interactive Website & Playground

This repository contains the interactive website and developer playground:

```bash
# Install dependencies
npm install

# Run the playground locally
cd playground-src
npm install
npm run dev
```

Visit the live production deployment: [https://eazystudiio.github.io/hoversense/playground/](https://eazystudiio.github.io/hoversense/playground/)

---

## Core Math Only (Lean Branch)

If you are building custom WebGL shaders, Three.js scenes, game viewports, or non-web runtimes (Kotlin, Swift, Rust), you do not need DOM helpers or website assets.

Switch to the **[`lean`](https://github.com/EaZyStudiio/hoversense/tree/lean)** branch:
* Pure geometric calculations (`distToRect`, `resolveScreen`, `computeIntent`, `arbitrate`).
* Zero DOM code, zero website assets.
* Lightweight TypeScript core with zero dependencies.

```bash
git checkout lean
```

---

## License

MIT License. Copyright (c) 2026 EaZy (EaZyStudiio).
