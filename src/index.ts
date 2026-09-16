/**
 * HoverSense
 * Framework-agnostic pointerless interaction library for touch interfaces.
 *
 * It lets interfaces respond to where a user is looking, touching, holding,
 * dragging, and scrolling without requiring the user to learn a new gesture.
 */

export {
  HoverSense,
  createHoverSense,
  createHoverSenseContainer,
  type HoverSenseContainerController,
} from './engine';
export { DEFAULT_CONFIG, DEFAULT_SAFE_ZONES } from './defaults';
export {
  CSS_VARS,
  DATA_ATTRS,
  TOUCH_HYGIENE_STYLES,
  applyTouchHygiene,
  CssVariableBinder,
  type CssBinderOptions,
} from './css';
export {
  HoverSenseFeedback,
  createHoverSenseFeedback,
  type FeedbackOverlayOptions,
} from './feedback';
export * from './math';
export * from './types';

