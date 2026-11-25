import { MAX_DURATION_MIN, MIN_DURATION_MIN } from '@/content/manifest';

/**
 * The time dial works like a clock face: one full circle is 60 minutes, so each
 * minute is 6°. 60 sits at the top (12 o'clock), 15 at 3 o'clock, 30 at 6 o'clock.
 */
export const DIAL_MIN = MIN_DURATION_MIN;
export const DIAL_MAX = MAX_DURATION_MIN;
export const DEG_PER_MINUTE = 6;

/** Angle of a point around a centre: 0° at the top, growing clockwise, in [0, 360). */
export function angleOf(x: number, y: number, cx: number, cy: number): number {
  const deg = (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
  return (deg + 360) % 360;
}

const clamp = (v: number) => Math.min(DIAL_MAX, Math.max(DIAL_MIN, v));

/** Minutes for a tap at `angle`: jump straight there. The top counts as 60. */
export function valueForTap(angle: number): number {
  const raw = Math.round(angle / DEG_PER_MINUTE) % 60;
  return clamp(raw === 0 ? DIAL_MAX : raw);
}

/**
 * Minutes while dragging from `prev`. Crossing the top is blocked: dragging past
 * 60 stays at 60, and dragging back past the start stays at the minimum, so the
 * value never flips between 60 and the minimum.
 */
export function valueForDrag(prev: number, angle: number): number {
  const raw = Math.round(angle / DEG_PER_MINUTE) % 60;
  if (prev >= 45 && raw <= 15) return DIAL_MAX;
  if (prev <= 15 && (raw >= 45 || raw === 0)) return DIAL_MIN;
  return clamp(raw);
}

/** Angle of the knob for a value. */
export function angleForValue(value: number): number {
  return clamp(value) * DEG_PER_MINUTE;
}

/**
 * Accessibility steps: single minutes up to 10, then 5-minute steps,
 * so VoiceOver users reach 60 in a reasonable number of swipes.
 */
export function stepValue(value: number, direction: 1 | -1): number {
  if (direction === 1) {
    return clamp(value < 10 ? value + 1 : Math.floor(value / 5) * 5 + 5);
  }
  return clamp(value <= 10 ? value - 1 : Math.ceil(value / 5) * 5 - 5);
}

/** Position on a circle of `radius` for an angle (0° = top), relative to the centre. */
export function pointAt(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) };
}
