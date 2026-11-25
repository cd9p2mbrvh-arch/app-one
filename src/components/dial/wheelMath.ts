import { DEG_PER_MINUTE, DIAL_MAX, DIAL_MIN } from './dialMath';

/**
 * The rotating time wheel: the numbers sit on a wheel that turns under a fixed
 * marker at the top. The value is the number under the marker. Turning the wheel
 * clockwise adds time (like a kitchen timer), so the numbers are laid out
 * counter-clockwise: minute m sits at -m × 6° on the wheel, and the wheel is
 * turned by +value × 6° to bring it to the top.
 */

/** Wheel rotation (degrees, clockwise) that puts `value` under the top marker. */
export function rotationForValue(value: number): number {
  return value * DEG_PER_MINUTE;
}

/** Where minute `m` sits on the unturned wheel (degrees, 0 = top, clockwise). */
export function wheelAngleOf(minute: number): number {
  return -minute * DEG_PER_MINUTE;
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

/** Exact value after the finger turned the wheel by `delta` degrees. */
export function valueAfterTurn(exact: number, delta: number): number {
  return clampExact(exact + delta / DEG_PER_MINUTE);
}

/** Whole minutes shown for an exact value (what the wheel settles on). */
export function settledValue(exact: number): number {
  return Math.round(clampExact(exact));
}

/**
 * Minute printed on the wheel at a touched screen angle, given the wheel's
 * current value. Used for "tap a number to turn to it". The empty part of the
 * wheel between 60 and the minimum goes to the nearer end.
 */
export function valueAtTouch(touchAngle: number, currentValue: number): number {
  const onWheel = touchAngle - rotationForValue(currentValue);
  const minute = ((Math.round(-onWheel / DEG_PER_MINUTE) % 60) + 60) % 60 || 60;
  if (minute >= DIAL_MIN) return minute;
  // 1…(min-1): closer to 60 or to the minimum?
  return minute < DIAL_MIN / 2 ? DIAL_MAX : DIAL_MIN;
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
