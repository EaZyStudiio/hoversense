# HoverSense

HoverSense is a framework-agnostic pointerless interaction library for touch interfaces.

It lets interfaces respond to where a user is looking, touching, holding, dragging, and scrolling without requiring the user to learn a new gesture.

```ts
import { HoverSense } from 'hoversense';

const hover = new HoverSense({
  screen: { anchorRatio: 0.42, bandRatio: 0.30 },
  touch: { holdMsMin: 320, engageAt: 1.0 }
});

// Register any DOM element, ref, or dynamic bounding rect
document.querySelectorAll('.card').forEach((el, index) => {
  hover.register(`card-${index}`, el);
});

// Listen to spatial hover changes
hover.onHover((hits) => {
  hits.forEach(hit => {
    console.log(`Target: ${hit.id}, Strength: ${hit.strength}, Source: ${hit.source}`);
  });
});
```

```kotlin
// Android (Jetpack Compose / Kotlin)
val hoverMath = HoverSenseMath
val hitTarget = hoverMath.getHitUnderPoint(touchPoint, registeredItems, touchConfig)
val intent = hoverMath.computeIntent(gestureState, touchConfig, System.currentTimeMillis().toDouble())
```

```swift
// iOS (SwiftUI / UIKit)
let anchorY = viewHeight * 0.42
let hits = HoverSenseMath.resolveScreen(items: items, height: viewHeight, config: screenConfig)
```

> **The goal is not to teach users another interaction pattern. It is to make the interface feel like it already understands them.**

---

## Conceptual Taxonomy

- **HoverSense**: The library and runtime system you install and configure.
- **Pointerless interaction**: The category and UX challenge (touchscreens have no continuous cursor).
- **Spatial hover**: The underlying interaction model and physical behaviors (gaze anchor, proximity falloff, intent accumulation, and latch arbitration).

---

## Key Features

- **Zero UI Constraints**: Framework-agnostic. Bring your own design, animations, and components.
- **Dual-Channel Spatial Architecture**:
  - **Screen Channel (Gaze Anchor)**: Focuses content at the natural line of sight (42% viewport height) with smooth proximity falloff during scrolling.
  - **Touch Channel (Deliberate Intent)**: Tracks touch dwell and lateral drag, filtering capacitive jitter and scroll flicks.
- **Biomechanical Safe Zones**: Feathered rejection filters that suppress palm contact, resting thumbs, and edge-swipe system gestures.
- **Seamless Channel Arbitration**: Smooth mathematical crossfades between screen focus and touch latching.
- **Polyglot Reference Math**: Math foundations provided in TypeScript, Python, Kotlin, Java, C++, and Rust.

---

## Installation

```bash
npm install hoversense
```

Or via CDN:

```html
<script type="module">
  import { HoverSense } from 'https://unpkg.com/hoversense/dist/hoversense.es.js';
</script>
```

---

## Quick Start

### 1. Vanilla JavaScript / TypeScript

```ts
import { HoverSense } from 'hoversense';

const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42, // Gaze line at 42% of viewport height
    bandRatio: 0.30,   // Proximity falloff band radius
  },
  touch: {
    holdMsMin: 320,    // Time held to engage hover (ms)
    outerFalloffPx: 42 // Boundary snap cushion
  }
});

// Register items
document.querySelectorAll('.item').forEach((el) => {
  engine.register(el.id, el);
});

// Update UI on hover changes
engine.onHover((hits) => {
  document.querySelectorAll('.item').forEach(el => {
    el.classList.remove('is-hovered');
  });

  hits.forEach(hit => {
    const el = document.getElementById(hit.id);
    if (el) {
      el.classList.add('is-hovered');
      el.style.setProperty('--hover-strength', hit.strength.toString());
    }
  });
});
```

### 2. React

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { HoverSense, HoverHit } from 'hoversense';

export function ProductGrid({ items }) {
  const [hits, setHits] = useState<HoverHit[]>([]);
  const engineRef = useRef<HoverSense | null>(null);

  useEffect(() => {
    const engine = new HoverSense();
    engine.onHover((newHits) => setHits(newHits));
    engineRef.current = engine;

    return () => engine.destroy();
  }, []);

  const hitsMap = new Map(hits.map(h => [h.id, h]));

  return (
    <div className="grid">
      {items.map((item) => {
        const hit = hitsMap.get(item.id);
        const strength = hit ? hit.strength : 0;

        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) engineRef.current?.register(item.id, el);
              else engineRef.current?.unregister(item.id);
            }}
            style={{
              transform: `scale(${1 + strength * 0.04})`,
              boxShadow: strength > 0.1 ? `0 8px 24px rgba(0,0,0,0.12)` : 'none'
            }}
          >
            <h3>{item.title}</h3>
          </div>
        );
      })}
    </div>
  );
}
```

### 3. Vue 3

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { HoverSense } from 'hoversense';

const activeHits = ref([]);
let engine = null;

onMounted(() => {
  engine = new HoverSense();
  engine.onHover(hits => { activeHits.value = hits; });
});

onUnmounted(() => {
  engine?.destroy();
});

const bindItem = (id, el) => {
  if (el) engine?.register(id, el);
  else engine?.unregister(id);
};
</script>

<template>
  <div class="list">
    <div
      v-for="item in items"
      :key="item.id"
      :ref="el => bindItem(item.id, el)"
      class="card"
    >
      {{ item.title }}
    </div>
  </div>
</template>
```

### 4. Svelte

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { HoverSense } from 'hoversense';

  let engine;
  let hits = [];

  onMount(() => {
    engine = new HoverSense();
    engine.onHover(newHits => { hits = newHits; });
  });

  onDestroy(() => {
    engine?.destroy();
  });

  function hoverable(node, id) {
    engine.register(id, node);
    return {
      destroy() {
        engine.unregister(id);
      }
    };
  }
</script>

{#each items as item (item.id)}
  <div use:hoverable={item.id} class="card">
    {item.title}
  </div>
{/each}
```

---

## The Mathematics of Spatial Hover

HoverSense isolates its mathematical foundations in pure, dependency-free modules:

### 1. Cubic Hermite Smoothstep
Used to calculate falloff curves and boundary gradients without hard velocity discontinuities.

$$\text{smooth}(t) = 3x^2 - 2x^3 \quad \text{where} \quad x = \text{clamp}(t, 0, 1)$$

### 2. Euclidean Bounding Box Distance
Evaluates the exact distance from touch coordinates to arbitrary rectangular bounds:

$$dx = \max(0, \text{rect.left} - x, x - \text{rect.right})$$
$$dy = \max(0, \text{rect.top} - y, y - \text{rect.bottom})$$
$$\text{dist}(P, R) = \sqrt{dx^2 + dy^2}$$

### 3. Biomechanical Intent Accumulation
Intent ($I \in [0.0, 1.0]$) balances contact dwell time and lateral displacement:

$$I = \text{clamp}\left( \max\left( \frac{\Delta t}{\text{holdMs}}, \frac{D_{\text{effective}} - D_{\text{deadzone}}}{D_{\text{full}} - D_{\text{deadzone}}} \times w_{\text{zone}} \right), 0, 1 \right)$$

where $D_{\text{effective}} = \sqrt{\Delta x^2 + (\Delta y \cdot 0.22)^2}$.

### 4. Gaze Anchor Proximity
Passive screen-channel hovering evaluates item distance from the anchor line ($Y_{\text{anchor}} = H_{\text{viewport}} \times 0.42$):

$$S_{\text{screen}} = \text{smooth}\left( 1 - \frac{|Y_{\text{item}} - Y_{\text{anchor}}|}{\text{bandRadius}} \right)$$

---

## Configuration Reference

```ts
const engine = new HoverSense({
  screen: {
    anchorRatio: 0.42,       // Anchor line position (fraction of viewport height)
    bandRatio: 0.30,         // Falloff band radius
    resolve: 'global',       // 'global' or 'per-column'
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
  },
  safeZones: [
    { id: 'thumb-rest', left: 0, right: 1, top: 0.80, bottom: 1.00, weight: 0.00, featherPx: 110 },
    { id: 'edge-left',  left: 0, right: 0.07, top: 0, bottom: 1, weight: 0.25, featherPx: 40 },
    { id: 'edge-right', left: 0.93, right: 1, top: 0, bottom: 1, weight: 0.25, featherPx: 40 },
    { id: 'top-chrome', left: 0, right: 1, top: 0, bottom: 0.09, weight: 0.00, featherPx: 50 }
  ],
  modes: {
    screen: true,
    touch: true
  }
});
```

---

## Polyglot Reference Implementations

The core math is available in multiple programming languages:

| Language | Location | Target Environment |
| :--- | :--- | :--- |
| **TypeScript** | `src/math.ts` | Web, Node, React Native |
| **Python** | `math/python/hoversense_math.py` | Backend analysis, ML, PyGame |
| **Kotlin** | `math/kotlin/HoverSenseMath.kt` | Android (Compose / Views) |
| **Java** | `math/java/HoverSenseMath.java` | Android, JVM |
| **C++** | `math/cpp/hoversense_math.hpp` | Game engines (Unreal, custom), Embedded |
| **Rust** | `math/rust/src/lib.rs` | High-performance graphics, Bevy, Wasm |

---

## License

MIT License (c) EaZy (https://github.com/EaZyStudiio)
