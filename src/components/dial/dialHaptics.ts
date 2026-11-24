/**
 * Decides which haptic (if any) to play as the dial value changes.
 *
 * Fast spins produce many value changes per second; firing a haptic for each one
 * overwhelms the haptic engine and feels uneven. So:
 * - ticks are spaced at least MIN_GAP_MS apart (5-minute marks: MAJOR_GAP_MS);
 * - when moving faster than FAST_MINUTES_PER_SECOND, only 5-minute marks tick.
 */
export const MIN_GAP_MS = 50;
export const MAJOR_GAP_MS = 30;
export const FAST_MINUTES_PER_SECOND = 15;

export type DialHaptic = 'major' | 'minor' | null;

type Input = {
  value: number;
  /** Timestamp of this change, in ms. */
  now: number;
  /** Timestamp of the last haptic played, in ms (or -Infinity). */
  lastHapticAt: number;
  /** Current speed in minutes per second (absolute). */
  speed: number;
};

export function hapticForStep({ value, now, lastHapticAt, speed }: Input): DialHaptic {
  const since = now - lastHapticAt;
  if (value % 5 === 0) return since >= MAJOR_GAP_MS ? 'major' : null;
  if (speed > FAST_MINUTES_PER_SECOND) return null;
  return since >= MIN_GAP_MS ? 'minor' : null;
}

/** Speed in minutes per second between two samples; 0 if no time has passed. */
export function speedBetween(fromValue: number, fromTime: number, toValue: number, toTime: number) {
  const dt = toTime - fromTime;
  return dt > 0 ? (Math.abs(toValue - fromValue) * 1000) / dt : 0;
}
