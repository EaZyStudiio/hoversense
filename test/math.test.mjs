/**
 * HoverSense Mathematics Unit Test Suite
 * Exhaustive Edge Case Validation
 */

import assert from 'node:assert/strict';

function clamp(v, lo, hi) {
  const actualLo = Math.min(lo, hi);
  const actualHi = Math.max(lo, hi);
  return Math.min(Math.max(v, actualLo), actualHi);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smooth(t) { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); }

function distToRect(pt, r) {
  const minX = Math.min(r.left, r.right);
  const maxX = Math.max(r.left, r.right);
  const minY = Math.min(r.top, r.bottom);
  const maxY = Math.max(r.top, r.bottom);
  const dx = Math.max(0, minX - pt.x, pt.x - maxX);
  const dy = Math.max(0, minY - pt.y, pt.y - maxY);
  return Math.hypot(dx, dy);
}

function zonePenetration(pt, z, vw, vh) {
  const safeVw = Math.max(1, vw);
  const safeVh = Math.max(1, vh);
  const l = z.left * safeVw;
  const r = z.right * safeVw;
  const t = z.top * safeVh;
  const b = z.bottom * safeVh;
  const f = Math.max(1, z.featherPx ?? 60);
  const d = Math.min(pt.x - l, r - pt.x, pt.y - t, b - pt.y);
  return smooth((d + f / 2) / f);
}

function sampleZones(pt, zones, vw, vh) {
  let weight = 1, hit = null;
  if (!zones || zones.length === 0) return { weight: 1.0, zoneId: null };
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
  const elapsed = Math.max(0, (g.endTime ?? now) - g.startTime);
  const hold = clamp(elapsed / Math.max(1, holdMs), 0, 1);
  const dx = g.x - g.startX, dy = g.y - g.startY;
  const eff = Math.hypot(dx, dy * cfg.verticalDragWeight);
  const drag = clamp((eff - cfg.dragDeadzonePx) / (cfg.dragFullPx - cfg.dragDeadzonePx), 0, 1);
  return clamp(Math.max(hold, drag * g.zoneWeight), 0, 1);
}

function isTap(g, cfg) {
  if (!g.startTime) return false;
  const duration = Math.max(0, (g.endTime ?? g.lastTime) - g.startTime);
  const movement = Math.hypot(g.x - g.startX, g.y - g.startY);
  return duration <= cfg.tapMaxMs && movement <= cfg.tapMaxMovePx;
}

function getHitUnderPoint(point, items, cfg) {
  if (!point || !items.length) return null;
  const validItems = items.filter(it => it && it.rect && Number.isFinite(it.rect.left));
  if (!validItems.length) return null;

  const direct = validItems.find(it => {
    const r = it.rect;
    const minX = Math.min(r.left, r.right);
    const maxX = Math.max(r.left, r.right);
    const minY = Math.min(r.top, r.bottom);
    const maxY = Math.max(r.top, r.bottom);
    return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;
  });
  if (direct) return direct.id;

  const dists = validItems
    .map(it => ({ id: it.id, d: distToRect(point, it.rect) }))
    .sort((a, b) => a.d - b.d);

  const closest = dists[0];
  const second = dists[1];

  const outerFalloff = Math.max(0, cfg.outerFalloffPx ?? 42);
  const inBetweenRatio = clamp(cfg.inBetweenRatio ?? 0.40, 0, 1);

  let effectiveFalloff = outerFalloff;
  if (second) {
    const gapSpan = closest.d + second.d;
    const gapAllowance = (gapSpan / 2) * inBetweenRatio;
    effectiveFalloff = Math.min(outerFalloff, gapAllowance);
  }

  if (closest.d <= effectiveFalloff) {
    return closest.id;
  }
  return null;
}

console.log('Running Exhaustive Edge-Case Verification Tests...');

// 1. Clamp with normal and inverted bounds
assert.equal(clamp(5, 0, 10), 5);
assert.equal(clamp(-5, 0, 10), 0);
assert.equal(clamp(15, 0, 10), 10);
assert.equal(clamp(5, 10, 0), 5, 'Inverted bounds handled safely');
console.log('  [PASS] clamp & inverted bounds');

// 2. distToRect with standard and inverted rect
const testRect = { left: 10, right: 30, top: 10, bottom: 30 };
assert.equal(distToRect({ x: 20, y: 20 }, testRect), 0, 'Inside rect');
assert.equal(distToRect({ x: 5, y: 20 }, testRect), 5, 'Left edge');
assert.equal(distToRect({ x: 34, y: 33 }, testRect), 5, 'Diagonal corner');

const invertedRect = { left: 30, right: 10, top: 30, bottom: 10 };
assert.equal(distToRect({ x: 20, y: 20 }, invertedRect), 0, 'Inside inverted rect');
assert.equal(distToRect({ x: 5, y: 20 }, invertedRect), 5, 'Outside inverted rect');
console.log('  [PASS] distToRect & inverted rectangles');

// 3. Safe zone edge cases (zero viewport & empty zones)
assert.equal(sampleZones({ x: 0, y: 0 }, [], 400, 800).weight, 1.0, 'Empty safe zones');
assert(Number.isFinite(zonePenetration({ x: 0, y: 0 }, { left: 0, right: 1, top: 0, bottom: 1 }, 0, 0)), 'Zero viewport size handled');
console.log('  [PASS] safe zones edge cases');

// 4. Tap discriminator edge cases
assert.equal(isTap({ startTime: 0 }, { tapMaxMs: 180 }), false, 'Uninitialized gesture is not a tap');
assert.equal(isTap({ startTime: 1000, lastTime: 1050, startX: 10, startY: 10, x: 12, y: 12 }, { tapMaxMs: 180, tapMaxMovePx: 10 }), true, 'Valid tap');
assert.equal(isTap({ startTime: 1000, lastTime: 1250, startX: 10, startY: 10, x: 12, y: 12 }, { tapMaxMs: 180, tapMaxMovePx: 10 }), false, 'Duration exceeded is not a tap');
assert.equal(isTap({ startTime: 1000, lastTime: 1050, startX: 10, startY: 10, x: 50, y: 50 }, { tapMaxMs: 180, tapMaxMovePx: 10 }), false, 'Movement exceeded is not a tap');
console.log('  [PASS] isTap discriminator');

// 5. getHitUnderPoint edge cases
const items = [
  { id: 'c1', rect: { left: 10, right: 50, top: 10, bottom: 50 } },
  { id: 'c2', rect: { left: 100, right: 140, top: 10, bottom: 50 } },
];
// Direct hit on c1
assert.equal(getHitUnderPoint({ x: 25, y: 25 }, items, { outerFalloffPx: 42, inBetweenRatio: 0.4 }), 'c1');
// Point slightly outside c1 left edge (x: 5, y: 25 -> dist: 5px <= 42px) -> snaps to c1
assert.equal(getHitUnderPoint({ x: 5, y: 25 }, items, { outerFalloffPx: 42, inBetweenRatio: 0.4 }), 'c1');
// Point far outside (x: 200, y: 200 -> dist > 42px) -> returns null (deselect)
assert.equal(getHitUnderPoint({ x: 200, y: 200 }, items, { outerFalloffPx: 42, inBetweenRatio: 0.4 }), null);
// In-between gap: gap between c1 right (50) and c2 left (100) is 50px.
// Midpoint is x=75 (25px from each). Gap allowance = (25 + 25)/2 * 0.4 = 10px.
// Point at x=75 has dist 25px > 10px allowance -> deselects (gutter deadzone)!
assert.equal(getHitUnderPoint({ x: 75, y: 25 }, items, { outerFalloffPx: 42, inBetweenRatio: 0.4 }), null, 'Gutter center is deadzone');
// Point at x=55 (5px from c1) has dist 5px <= 10px allowance -> snaps to c1!
assert.equal(getHitUnderPoint({ x: 55, y: 25 }, items, { outerFalloffPx: 42, inBetweenRatio: 0.4 }), 'c1', 'Within gutter edge snap');

// Single item edge case
const singleItem = [{ id: 'solo', rect: { left: 10, right: 50, top: 10, bottom: 50 } }];
assert.equal(getHitUnderPoint({ x: 20, y: 20 }, singleItem, { outerFalloffPx: 42 }), 'solo');
assert.equal(getHitUnderPoint({ x: 55, y: 25 }, singleItem, { outerFalloffPx: 42 }), 'solo');
assert.equal(getHitUnderPoint({ x: 100, y: 25 }, singleItem, { outerFalloffPx: 42 }), null);
console.log('  [PASS] getHitUnderPoint & gutter deadzone/single item cases');

// 6. Dual-Channel Empty Space Deselect & Gaze Takeover Arbitration
function arbitrate(params) {
  const { screenHits, touchHit, authority, modes, isCleanup } = params;
  const safeAuthority = clamp(authority, 0, 1);
  const map = new Map();

  const addHit = (h, multiplier) => {
    if (!h) return;
    const s = h.strength * multiplier;
    if (s <= 0.001) return;
    const prev = map.get(h.id);
    if (!prev || s > prev.strength) {
      map.set(h.id, { ...h, strength: s });
    }
  };

  const hasTouchTarget = Boolean(touchHit && touchHit.id);
  const effectiveAuthority = (hasTouchTarget && !isCleanup) ? safeAuthority : 0;

  if (modes.screen) {
    const screenScale = modes.touch ? 1 - effectiveAuthority : 1.0;
    screenHits.forEach(h => addHit(h, screenScale));
  }

  if (modes.touch && !isCleanup) {
    addHit(touchHit, safeAuthority);
  }

  return Array.from(map.values()).sort((a, b) => b.strength - a.strength);
}

const sampleScreenHits = [{ id: 'card-gaze-1', strength: 0.95, source: 'screen' }];
const sampleTouchHit = { id: 'card-touch-2', strength: 1.0, source: 'touch' };

// When touch target is active, touch holds authority and scales screen down
const engagedResult = arbitrate({
  screenHits: sampleScreenHits,
  touchHit: sampleTouchHit,
  authority: 1.0,
  modes: { screen: true, touch: true },
});
assert.equal(engagedResult.length, 1);
assert.equal(engagedResult[0].id, 'card-touch-2');

// When touch is in empty space (touchHit is null), Gaze immediately takes over at full strength
const emptySpaceResult = arbitrate({
  screenHits: sampleScreenHits,
  touchHit: null,
  authority: 1.0,
  modes: { screen: true, touch: true },
});
assert.equal(emptySpaceResult.length, 1, 'Gaze takes over when touchHit is null');
assert.equal(emptySpaceResult[0].id, 'card-gaze-1');
assert.equal(emptySpaceResult[0].strength, 0.95, 'Gaze retains full strength');

// When an explicit cleanup/deselect frame occurs, Gaze takes over and touch hit is omitted
const cleanupResult = arbitrate({
  screenHits: sampleScreenHits,
  touchHit: sampleTouchHit,
  authority: 1.0,
  modes: { screen: true, touch: true },
  isCleanup: true,
});
assert.equal(cleanupResult.length, 1, 'Cleanup forces Gaze takeover');
assert.equal(cleanupResult[0].id, 'card-gaze-1');
console.log('  [PASS] dual-channel empty space deselect & gaze takeover');

console.log('\nAll 16 Math & Edge-Case Tests Passed Successfully!');
