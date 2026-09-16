# HoverSense Integration Guide

HoverSense is completely framework-agnostic with zero external dependencies.

---

## 1. Package Manager Installation

Install with your preferred package manager:

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

---

## 2. CDN & Script Tag (Zero Build Tools)

For static HTML files, WordPress, Webflow, Shopify, or simple landing pages, load HoverSense directly:

### Modern ES Module via unpkg:
```html
<script type="module">
  import { HoverSense } from 'https://unpkg.com/hoversense/dist/hoversense.es.js';

  const hover = new HoverSense();
  document.querySelectorAll('.card').forEach(el => hover.register(el.id, el));
  hover.onHover(hits => {
    // update your visual styles
  });
</script>
```

### Classical IIFE / UMD (Global `window.HoverSense`):
```html
<script src="https://unpkg.com/hoversense/dist/hoversense.iife.js"></script>
<script>
  const hover = new HoverSense.HoverSense();
  document.querySelectorAll('.card').forEach(el => hover.register(el.id, el));
</script>
```

---

## 3. Manual Copy-Paste Drop-In

If you work in an offline environment, game engine webview, or do not want an npm dependency:

1. Copy [`src/math.ts`](../src/math.ts) and [`src/engine.ts`](../src/engine.ts) directly into your project's codebase.
2. Import directly:
```ts
import { HoverSense } from './engine';
```
There are zero external dependencies to install.

---

## 4. Framework Integration Recipes

### Vanilla JavaScript / TypeScript
```ts
import { HoverSense } from 'hoversense';

const engine = new HoverSense({
  screen: { anchorRatio: 0.42, bandRatio: 0.30 },
  touch: { holdMsMin: 320 }
});

const cards = document.querySelectorAll('.product-card');
cards.forEach(card => engine.register(card.id, card));

engine.onHover(hits => {
  cards.forEach(card => card.classList.remove('is-active'));
  hits.forEach(hit => {
    const el = document.getElementById(hit.id);
    if (el) {
      el.classList.add('is-active');
      el.style.setProperty('--hover-intensity', hit.strength.toFixed(3));
    }
  });
});
```

### React (Custom Hook)
```tsx
import { useEffect, useRef, useState } from 'react';
import { HoverSense, HoverHit, HoverSenseOptions } from 'hoversense';

export function useHoverSense(options?: HoverSenseOptions) {
  const [hits, setHits] = useState<HoverHit[]>([]);
  const engineRef = useRef<HoverSense | null>(null);

  useEffect(() => {
    const engine = new HoverSense(options);
    engine.onHover(newHits => setHits(newHits));
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  const bind = (id: string) => (el: HTMLElement | null) => {
    if (el) engineRef.current?.register(id, el);
    else engineRef.current?.unregister(id);
  };

  return { hits, bind, engine: engineRef.current };
}

// In your component:
export function Gallery({ items }) {
  const { hits, bind } = useHoverSense();
  const hitsMap = new Map(hits.map(h => [h.id, h.strength]));

  return (
    <div className="gallery">
      {items.map(it => (
        <div
          key={it.id}
          ref={bind(it.id)}
          style={{ transform: `scale(${1 + (hitsMap.get(it.id) ?? 0) * 0.05})` }}
        >
          {it.title}
        </div>
      ))}
    </div>
  );
}
```

### Vue 3 (Composition API)
```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { HoverSense } from 'hoversense';

const hits = ref([]);
let engine = null;

onMounted(() => {
  engine = new HoverSense();
  engine.onHover(newHits => { hits.value = newHits; });
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
      class="item"
    >
      {{ item.name }}
    </div>
  </div>
</template>
```

### Svelte (Action Directive)
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

  onDestroy(() => engine?.destroy());

  function hoverTarget(node, id) {
    engine.register(id, node);
    return {
      destroy() {
        engine.unregister(id);
      }
    };
  }
</script>

{#each items as item (item.id)}
  <div use:hoverTarget={item.id} class="card">
    {item.title}
  </div>
{/each}
```
