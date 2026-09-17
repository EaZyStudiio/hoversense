/**
 * Unit Tests for HoverSense CSS Engine and Custom Property Binder
 */

import assert from 'node:assert/strict';
import { CssVariableBinder, CSS_VARS, DATA_ATTRS, applyTouchHygiene } from '../dist/hoversense.es.js';

class MockElement {
  constructor(id) {
    this.id = id;
    this.styleMap = new Map();
    this.attrs = new Map();
    this.style = {
      setProperty: (k, v) => this.styleMap.set(k, String(v)),
      removeProperty: (k) => this.styleMap.delete(k),
      getPropertyValue: (k) => this.styleMap.get(k) || '',
    };
  }

  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }

  removeAttribute(k) {
    this.attrs.delete(k);
  }

  getAttribute(k) {
    return this.attrs.get(k) || null;
  }
}

function testCssVariableBinder() {
  console.log('Testing CssVariableBinder...');
  const binder = new CssVariableBinder({ precision: 0.01 });

  const el1 = new MockElement('card-1');
  const el2 = new MockElement('card-2');
  const elementsById = new Map([
    ['card-1', el1],
    ['card-2', el2],
  ]);

  // Frame 1: Hit card-1 with screen source at strength 0.85
  binder.update([{ id: 'card-1', strength: 0.85, source: 'screen' }], elementsById, false);

  assert.equal(el1.style.getPropertyValue(CSS_VARS.STRENGTH), '0.850');
  assert.equal(el1.style.getPropertyValue(CSS_VARS.SOURCE), 'screen');
  assert.equal(el1.style.getPropertyValue(CSS_VARS.LATCHED), '0');
  assert.equal(el1.getAttribute(DATA_ATTRS.HOVER), 'active');
  assert.equal(el1.getAttribute(DATA_ATTRS.SOURCE), 'screen');

  // Frame 2: Hit card-2 with touch source at strength 1.0 (latched)
  binder.update([{ id: 'card-2', strength: 1.0, source: 'touch' }], elementsById, true);

  // el2 should now be active and latched
  assert.equal(el2.style.getPropertyValue(CSS_VARS.STRENGTH), '1.000');
  assert.equal(el2.style.getPropertyValue(CSS_VARS.SOURCE), 'touch');
  assert.equal(el2.style.getPropertyValue(CSS_VARS.LATCHED), '1');
  assert.equal(el2.getAttribute(DATA_ATTRS.HOVER), 'active');

  // el1 should have been cleaned up
  assert.equal(el1.style.getPropertyValue(CSS_VARS.STRENGTH), '');
  assert.equal(el1.style.getPropertyValue(CSS_VARS.SOURCE), '');
  assert.equal(el1.getAttribute(DATA_ATTRS.HOVER), null);

  // Clear all
  binder.clear();
  assert.equal(el2.style.getPropertyValue(CSS_VARS.STRENGTH), '');
  assert.equal(el2.getAttribute(DATA_ATTRS.HOVER), null);

  console.log('  [PASS] CssVariableBinder updates, latches, and cleans up');
}

function testEngagedAttributeAndIndependentTransforms() {
  console.log('Testing data-hs-engaged and independent transforms...');
  const binder = new CssVariableBinder({
    precision: 0.01,
    engageThreshold: 0.75,
    bindIndependentTransforms: true,
    scaleDelta: 0.08,
  });

  const el = new MockElement('card-engaged');
  const elementsById = new Map([['card-engaged', el]]);

  // Frame 1: strength = 0.50 (below engageThreshold 0.75)
  binder.update([{ id: 'card-engaged', strength: 0.50, source: 'screen' }], elementsById, false);
  assert.equal(el.getAttribute(DATA_ATTRS.HOVER), 'active');
  assert.equal(el.getAttribute(DATA_ATTRS.ENGAGED), null, 'Engaged attribute should be null below threshold');
  assert.equal(el.style.getPropertyValue(CSS_VARS.SCALE), '1.0400', 'Scale should be 1 + 0.50 * 0.08 = 1.0400');
  assert.equal(el.style.getPropertyValue(CSS_VARS.TRANSLATE_Y), '-1.00px');

  // Frame 2: strength = 0.80 (meets engageThreshold 0.75)
  binder.update([{ id: 'card-engaged', strength: 0.80, source: 'screen' }], elementsById, false);
  assert.equal(el.getAttribute(DATA_ATTRS.ENGAGED), 'true', 'Engaged attribute should be true at or above threshold');
  assert.equal(el.style.getPropertyValue(CSS_VARS.SCALE), '1.0640', 'Scale should be 1 + 0.80 * 0.08 = 1.0640');
  assert.equal(el.style.getPropertyValue(CSS_VARS.TRANSLATE_Y), '-1.60px');

  // Frame 3: strength decays to 0.60 (drops below threshold)
  binder.update([{ id: 'card-engaged', strength: 0.60, source: 'screen' }], elementsById, false);
  assert.equal(el.getAttribute(DATA_ATTRS.ENGAGED), null, 'Engaged attribute should be removed when decaying below threshold');

  // Frame 4: clean up element completely
  binder.clear();
  assert.equal(el.getAttribute(DATA_ATTRS.ENGAGED), null);
  assert.equal(el.style.getPropertyValue(CSS_VARS.SCALE), '');
  assert.equal(el.style.getPropertyValue(CSS_VARS.TRANSLATE_Y), '');

  console.log('  [PASS] data-hs-engaged gates DOM mounting and independent transforms bind smoothly');
}

function testTouchHygiene() {
  console.log('Testing applyTouchHygiene...');
  const el = new MockElement('container');
  applyTouchHygiene(el);

  assert.equal(el.style.touchAction, 'pan-y');
  assert.equal(el.style.userSelect, 'none');
  assert.equal(el.style.webkitUserSelect, 'none');
  assert.equal(el.style['-webkit-tap-highlight-color'], 'transparent');
  assert.equal(el.style['-webkit-touch-callout'], 'none');

  console.log('  [PASS] applyTouchHygiene configures mandatory touch rules');
}

testCssVariableBinder();
testEngagedAttributeAndIndependentTransforms();
testTouchHygiene();
console.log('\nAll CSS Engine Unit Tests Passed Successfully!');
