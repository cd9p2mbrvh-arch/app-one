export type TimeOfDay = 'morning' | 'noon' | 'night';

/** Start hour (local time, 0–23) of each period. Night runs until morning starts. */
export const PERIOD_START_HOUR = {
  morning: 5,
  noon: 11,
  night: 18,
} as const satisfies Record<TimeOfDay, number>;

export function getTimeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours();
  if (hour >= PERIOD_START_HOUR.morning && hour < PERIOD_START_HOUR.noon) return 'morning';
  if (hour >= PERIOD_START_HOUR.noon && hour < PERIOD_START_HOUR.night) return 'noon';
  return 'night';
}
