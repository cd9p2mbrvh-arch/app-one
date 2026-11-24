/**
 * Timing for occasional scene events (airplane, fish, UFO…). After one event
 * finishes, the next starts after a random pause, so something happens roughly
 * every 10 seconds without feeling mechanical.
 */
export const FIRST_EVENT_MS: [number, number] = [3000, 6000];
export const EVENT_GAP_MS: [number, number] = [6000, 10000];

/** A random delay within [min, max]. `random` returns a number in [0, 1). */
export function delayBetween([min, max]: [number, number], random: () => number): number {
  return Math.round(min + (max - min) * random());
}

/** Picks the next event at random, avoiding an immediate repeat when possible. */
export function pickEvent<T extends string>(
  names: readonly T[],
  previous: T | null,
  random: () => number,
): T {
  const pool = names.length > 1 && previous ? names.filter((n) => n !== previous) : names;
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}
