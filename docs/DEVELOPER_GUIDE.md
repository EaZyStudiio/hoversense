# HoverSense Developer Guide: From Math to Mobile

HoverSense brings spatial hover to mobile touchscreens. While desktop hover relies on mouse coordinate events sent by the operating system, mobile devices have no native hover channel.

Making hover work on touch devices requires solving four distinct problems:
1. **Biomechanical Arbitration**: Deciding whether a touch is a click, a scroll, or a conscious intent to inspect an element.
2. **Mobile Touch Hygiene**: Preventing mobile browsers from triggering default gestures (double-tap zoom, text selection, callout menus, pull-to-refresh).
3. **Sub-Frame GPU Execution**: Updating element scales and glows at 60fps without choking the JavaScript thread with DOM re-renders.
4. **Visual Affordance**: Communicating touch authority and dwell intent to the user in real time.

This guide explains how to configure and style HoverSense in production applications.

---

## 1. Quick Start: The Turnkey Container

The fastest way to enable HoverSense is `createHoverSenseContainer`. It sets up touch hygiene, discovers child items, binds CSS custom properties, and mounts visual feedback overlays with a single function call:

```ts
import { createHoverSenseContainer } from 'hoversense';
import 'hoversense/dist/hoversense.css';

const controller = createHoverSenseContainer('#card-grid', {
  itemSelector: '.card',
  feedback: true,
});

// To teardown listeners and observers when navigating away:
// controller.destroy();
```

### Card Markup

```html
<div id="card-grid" class="hs-stage">
  <article class="card hs-item hs-item-scale" data-hs-id="card-1">
    <h3>Design System</h3>
    <p>Tokens, typography, and color schemes.</p>
  </article>

  <article class="card hs-item hs-item-scale" data-hs-id="card-2">
    <h3>Interaction Architecture</h3>
    <p>Gestures, spring physics, and safe zones.</p>
  </article>
</div>
```

---

## 2. Rule 1: Mobile Touch Hygiene

Mobile browsers attach aggressive default behaviors to touch interactions. If you do not sanitize the container, the browser will:
- Delay touch events by 300ms to check for double-tap zoom.
- Steal touch events to highlight and select text.
- Open system context menus when fingers dwell for 500ms.
- Cancel pointer events during vertical pan gestures.

### Mandatory Container CSS

Apply these properties to the parent stage or scrolling list:

```css
.my-container {
  /* Retain smooth vertical scrolling while disabling horizontal gestures */
  touch-action: pan-y;

  /* Suppress text selection during drag and dwell */
  -webkit-user-select: none;
  user-select: none;

  /* Suppress the iOS long-press callout menu */
  -webkit-touch-callout: none;

  /* Remove tap highlight flash */
  -webkit-tap-highlight-color: transparent;
}
```

If you use `createHoverSenseContainer`, these styles are applied automatically. If you build a custom setup, call `applyTouchHygiene(containerElement)`.

---

## 3. Rule 2: Zero-Render 60fps Styling with CSS Variables

Calling `setState` in React, Vue, or Svelte on every frame during scrolling or dragging causes component re-renders. At 60 frames per second, this causes noticeable frame drops on mid-tier mobile hardware.

HoverSense solves this by updating CSS custom properties directly on the hovered DOM element:

| CSS Variable | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `--hs-strength` | Float | `0.000` to `1.000` | Normalized hover activation strength |
| `--hs-source` | String | `'screen'` or `'touch'` | Active driving channel |
| `--hs-latched` | Binary String | `'1'` or `'0'` | `1` when locked to a finger latch |

Additionally, elements receive `data-hs-hover="active"` and `data-hs-source="screen|touch"` attributes for CSS selector matching.

### Styling Cards with CSS Custom Properties

Write your card styles to consume `--hs-strength`. Modern browsers process `transform` and `opacity` directly on the GPU compositor thread without triggering layout reflows:

```css
.card {
  position: relative;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #d4d8e6;

  /* 90ms linear transition provides responsive tactile feedback */
  transition:
    transform 90ms linear,
    box-shadow 90ms linear,
    border-color 90ms linear;

  /* GPU-accelerated scaling based on hover strength */
  transform: scale(calc(1 + var(--hs-strength, 0) * 0.038));

  /* Dynamic shadow depth */
  box-shadow: 0 4px calc(var(--hs-strength, 0) * 20px) rgba(0, 0, 0, calc(var(--hs-strength, 0) * 0.12));
}

/* Optional: Highlight card when driven by touch latch */
.card[data-hs-source="touch"] {
  border-color: #5b46d9;
}
```

---

## 4. Rule 3: The Two Channels and Authority Arbitration

HoverSense operates two independent input channels and combines them through an arbiter:

```
[Screen Channel: Line of Sight] \
                                  ---> [Channel Arbiter] ---> Active Hover State
[Touch Channel: Finger Intent]   /
```

### Channel 1: The Screen Position Channel (Passive)
As the user scrolls through content, items passing through the user's focal line of sight automatically receive soft hover highlights.
- **Anchor Line (`anchorRatio: 0.42`)**: Positioned at 42% of the viewport height (slightly above center to match reading gaze and avoid thumb occlusion).
- **Falloff Band (`bandRatio: 0.28`)**: Content within 28% viewport height of the anchor line scales proportionally to distance.

### Channel 2: The Touch Channel (Active)
When the user places a finger on an item:
- **Probing Phase**: Finger is down. Dwell duration and drag distance are measured.
- **Engage Threshold (`engageAt: 0.90`)**: At 90% confidence, touch hover locks onto the target card.
- **Scroll Lock (`scrollLockGraceMs: 220ms`)**: Fast vertical flicks are recognized as native scrolling and suppress hover engagement.
- **Hold Duration (`holdMsMin: 320ms`)**: Engagement occurs at 320ms, safely below the 500ms OS long-press menu threshold.

### Authority Arbitration
When a card is latched by touch, it takes precedence over the passive screen channel (touch authority = 1.0). As the user resumes scrolling:
- Authority remains 100% until scrolling exceeds `takeoverStartPx` (default: 180px).
- Authority smoothly decays from 180px to `takeoverFullPx` (default: 560px), returning control back to the screen channel.

---

## 5. Layout Patterns

### Pattern A: Single-Column Feed (1 x N)
In a vertical list, items cross the anchor line sequentially.

```ts
const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42,
    bandRatio: 0.28,
    resolve: 'global',
    rowSplit: 0.0, // Highlight full width
  },
});
```

### Pattern B: Staggered Columns (2 x N) and Grids (3 x 3)
When multiple items share the same vertical row, set `rowSplit: 1.0`. This ensures that cards in adjacent columns crossfade individually as you scroll past them instead of highlighting simultaneously.

```ts
const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42,
    bandRatio: 0.22,
    resolve: 'all',
    rowSplit: 1.0, // Staggers columns cleanly
  },
});
```

---

## 6. Dynamic Content and Infinite Scroll

When items are added or removed dynamically (e.g., infinite feeds or client-side filtering):

### Turnkey Container (Automatic)
`createHoverSenseContainer` includes a `MutationObserver` enabled by default (`observeMutations: true`). Newly appended elements matching `itemSelector` are automatically registered, and removed elements are cleaned up.

### Manual Engine Registration
If you manage registration manually, call `register` and `unregister`:

```ts
const engine = new HoverSense({ bindCssVariables: true });

// On item mount
engine.register('item-42', domElement);

// On item unmount
engine.unregister('item-42');
```

---

## 7. Visual Feedback Overlays

Visual feedback informs the user that an interaction is taking place before a click or navigation triggers:

```ts
import { HoverSense, HoverSenseFeedback } from 'hoversense';

const engine = new HoverSense();
const feedback = new HoverSenseFeedback({
  accentColor: '#5b46d9',
  emptyColor: '#8a8fa3',
  zIndex: 9999,
});

feedback.attach(engine);

// Later, on teardown:
// feedback.destroy();
```

The overlay automatically renders:
1. **Radial Progress Circle**: Tracks intent accumulation during the 320ms dwell window.
2. **Authority Ring**: Marks the touchdown coordinate when touch hover locks, fading out as scroll takeover decays.

---

## 8. Troubleshooting Common Issues

### Issue: Cards do not scale when scrolling
- Check that `.card` has `transition: transform 90ms linear;` and `transform: scale(calc(1 + var(--hs-strength, 0) * 0.038));`.
- Verify that `bindCssVariables: true` is passed to HoverSense options.

### Issue: Finger drag triggers browser page refresh or zoom
- Verify that `touch-action: pan-y;` is set on the container or body.
- Verify `user-select: none;` and `-webkit-touch-callout: none;` are present.

### Issue: Sliders or inputs inside cards cannot be dragged
- If a card contains nested interactive controls (sliders, form inputs), set `touch-action: none;` on the slider element and attach pointer capture (`e.currentTarget.setPointerCapture(e.pointerId)`) on `pointerdown`.
