/**
 * HoverSense Mathematics Unit Test Suite
 */

import assert from 'node:assert/strict';

// Pure math implementations replicated for Node runner
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); }
function distToRect(pt, r) {
  const dx = Math.max(0, r.left - pt.x, pt.x - r.right);
  const dy = Math.max(0, r.top - pt.y, pt.y - r.bottom);
  return Math.hypot(dx, dy);
}

function zonePenetration(pt, z, vw, vh) {
  const l = z.left * vw, r = z.right * vw, t = z.top * vh, b = z.bottom * vh;
  const f = Math.max(1, z.featherPx ?? 60);
  const d = Math.min(pt.x - l, r - pt.x, pt.y - t, b - pt.y);
  return smooth((d + f / 2) / f);
}

function sampleZones(pt, zones, vw, vh) {
  let weight = 1, hit = null;
  for (const z of zones) {
    const p = zonePenetration(pt, z, vw, vh);
    if (p <= 0) continue;
    const w = lerp(1, z.weight, p);
    if (w < weight) { weight = w; hit = z.id; }
  }
  return { weight, zoneId: hit };
}

function computeIntent(g, cfg, now) {
  if (g.scrollLocked) return 0;
  if (g.zoneWeight <= 0.001) return 0;
  const holdMs = lerp(cfg.holdMsMax, cfg.holdMsMin, g.zoneWeight);
  const elapsed = (g.endTime ?? now) - g.startTime;
  const hold = clamp(elapsed / holdMs, 0, 1);
  const dx = g.x - g.startX, dy = g.y - g.startY;
  const eff = Math.hypot(dx, dy * cfg.verticalDragWeight);
  const drag = clamp((eff - cfg.dragDeadzonePx) / (cfg.dragFullPx - cfg.dragDeadzonePx), 0, 1);
  return clamp(Math.max(hold, drag * g.zoneWeight), 0, 1);
}

function arbitrate({ screenHits, touchHit, authority, modes }) {
  const map = new Map();
  const add = (h, mul) => {
    if (!h) return;
    const s = h.strength * mul;
    if (s <= 0.001) return;
    const prev = map.get(h.id);
    if (!prev || s > prev.strength) map.set(h.id, { ...h, strength: s });
  };
  if (modes.screen) screenHits.forEach(h => add(h, modes.touch ? 1 - authority : 1));
  if (modes.touch) add(touchHit, authority);
  return [...map.values()].sort((a, b) => b.strength - a.strength);
}

console.log('Running HoverSense Math Verification Tests...');

// 1. Clamp tests
assert.equal(clamp(5, 0, 10), 5);
assert.equal(clamp(-5, 0, 10), 0);
assert.equal(clamp(15, 0, 10), 10);
console.log('  [PASS] clamp');

// 2. Lerp tests
assert.equal(lerp(10, 20, 0), 10);
assert.equal(lerp(10, 20, 1), 20);
assert.equal(lerp(10, 20, 0.5), 15);
console.log('  [PASS] lerp');

// 3. Smoothstep tests
assert.equal(smooth(0), 0);
assert.equal(smooth(1), 1);
assert.equal(smooth(0.5), 0.5);
assert(smooth(0.2) < 0.2); // S-curve ease in
assert(smooth(0.8) > 0.8); // S-curve ease out
console.log('  [PASS] smooth (Hermite S-curve)');

// 4. distToRect tests
const testRect = { left: 10, right: 30, top: 10, bottom: 30 };
assert.equal(distToRect({ x: 20, y: 20 }, testRect), 0, 'Inside rect');
assert.equal(distToRect({ x: 5, y: 20 }, testRect), 5, 'Left edge perpendicular');
assert.equal(distToRect({ x: 34, y: 33 }, testRect), 5, 'Diagonal corner hypotenuse (3, 4, 5)');
console.log('  [PASS] distToRect');

// 5. Safe zone sampling tests
const safeZones = [
  { id: 'thumb-rest', left: 0, right: 1, top: 0.80, bottom: 1.00, weight: 0.00, featherPx: 100 }
];
const centerSample = sampleZones({ x: 200, y: 300 }, safeZones, 400, 800);
assert.equal(centerSample.weight, 1.0, 'Center of screen has weight 1.0');

const bottomSample = sampleZones({ x: 200, y: 750 }, safeZones, 400, 800);
assert(bottomSample.weight < 0.2, 'Bottom thumb area is suppressed');
assert.equal(bottomSample.zoneId, 'thumb-rest');
console.log('  [PASS] sampleZones');

// 6. Intent accumulation tests
const touchCfg = {
  holdMsMin: 300,
  holdMsMax: 1000,
  dragDeadzonePx: 10,
  dragFullPx: 50,
  verticalDragWeight: 0.2
};
const gIdle = {
  scrollLocked: false,
  zoneWeight: 1.0,
  startX: 100,
  startY: 100,
  x: 100,
  y: 100,
  startTime: 1000,
  endTime: null
};
assert.equal(computeIntent(gIdle, touchCfg, 1000), 0);
assert.equal(computeIntent(gIdle, touchCfg, 1150), 0.5);
assert.equal(computeIntent(gIdle, touchCfg, 1300), 1.0);
console.log('  [PASS] computeIntent (hold dwell)');

const gDrag = {
  scrollLocked: false,
  zoneWeight: 1.0,
  startX: 100,
  startY: 100,
  x: 150,
  y: 100,
  startTime: 1000,
  endTime: 1050
};
assert.equal(computeIntent(gDrag, touchCfg, 1050), 1.0);
console.log('  [PASS] computeIntent (lateral drag)');

// 7. Channel arbitration tests
const screenHits = [{ id: 'card1', strength: 0.8, source: 'screen' }];
const touchHit = { id: 'card2', strength: 1.0, source: 'touch' };
const arbitrated = arbitrate({
  screenHits,
  touchHit,
  authority: 0.5,
  modes: { screen: true, touch: true }
});
assert.equal(arbitrated.length, 2);
assert.equal(arbitrated[0].id, 'card2');
assert.equal(arbitrated[0].strength, 0.5);
assert.equal(arbitrated[1].id, 'card1');
assert.equal(arbitrated[1].strength, 0.4);
console.log('  [PASS] arbitrate (smooth crossfade)');

console.log('\nAll 7 Math Tests Passed Successfully!');
