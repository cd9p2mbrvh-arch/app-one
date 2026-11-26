import { DIAL_MAX, DIAL_MIN } from './dialMath';

/**
 * The rotating time wheel: the numbers sit on a wheel that turns under a fixed
 * marker at the top. The value is the number under the marker.
 *
 * WHEEL_DIRECTION sets which way adds time: -1 = turning anticlockwise adds time
 * (current), 1 = turning clockwise adds time (like a kitchen timer; the first
 * version). The numbers are laid out the opposite way round, so turning the
 * wheel brings the next number under the marker.
 */
export const WHEEL_DIRECTION: 1 | -1 = -1;

/**
 * The minutes from the minimum to the maximum are spread over the whole wheel,
 * with no empty part: 5…30 is 26 marks, so each minute gets 360° / 26 ≈ 13.8°,
 * and 30 sits right next to 5.
 */
export const WHEEL_STEPS = DIAL_MAX - DIAL_MIN + 1;
export const WHEEL_DEG_PER_MINUTE = 360 / WHEEL_STEPS;

/** Wheel rotation (degrees, clockwise) that puts `value` under the top marker. */
export function rotationForValue(value: number): number {
  return WHEEL_DIRECTION * (value - DIAL_MIN) * WHEEL_DEG_PER_MINUTE;
}

/** Where minute `m` sits on the unturned wheel (degrees, 0 = top, clockwise). */
export function wheelAngleOf(minute: number): number {
  return -WHEEL_DIRECTION * (minute - DIAL_MIN) * WHEEL_DEG_PER_MINUTE;
}

/** Shortest signed turn from angle `from` to angle `to`, in (-180, 180]. */
export function angleDelta(from: number, to: number): number {
  const d = (((to - from) % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

/** Keep an unrounded (mid-drag) value inside the allowed range. */
export function clampExact(value: number): number {
  return Math.min(DIAL_MAX, Math.max(DIAL_MIN, value));
}

/** Exact value after the finger turned the wheel by `delta` degrees (clockwise +). */
export function valueAfterTurn(exact: number, delta: number): number {
  const next = exact + (WHEEL_DIRECTION * delta) / WHEEL_DEG_PER_MINUTE;
  // Drop floating-point dust so a mark reached exactly counts as reached.
  return clampExact(Math.round(next * 1e9) / 1e9);
}

/** Whole minutes shown for an exact value (what the wheel settles on). */
export function settledValue(exact: number): number {
  return Math.round(clampExact(exact));
}

/**
 * Minute on the wheel at a touched screen angle, given the wheel's current value.
 * Used for "tap a number to turn to it".
 */
export function valueAtTouch(touchAngle: number, currentValue: number): number {
  const onWheel = touchAngle - rotationForValue(currentValue);
  const steps = Math.round((-WHEEL_DIRECTION * onWheel) / WHEEL_DEG_PER_MINUTE);
  return DIAL_MIN + (((steps % WHEEL_STEPS) + WHEEL_STEPS) % WHEEL_STEPS);
}

/**
 * The minute line that passed under the marker while the wheel turned from
 * `prev` to `next` (exact values), or null if none did. This is the moment to
 * tick and update the number, so the feedback lines up with the marks. If
 * several lines passed in one move, the last one is returned.
 */
export function crossedMinute(prev: number, next: number): number | null {
  if (next > prev) {
    const line = Math.floor(next);
    return line > prev ? line : null;
  }
  if (next < prev) {
    const line = Math.ceil(next);
    return line < prev ? line : null;
  }
  return null;
}
