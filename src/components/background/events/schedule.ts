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

export type WeightedName<T extends string> = { name: T; weight: number };

/**
 * Picks the next event at random, in proportion to its weight. The previous
 * event is excluded, unless it is clearly the most common one (the only event
 * with the highest weight), so rare events never come twice in a row while
 * common ones may.
 */
export function pickEvent<T extends string>(
  entries: readonly WeightedName<T>[],
  previous: T | null,
  random: () => number,
): T {
  const maxWeight = Math.max(...entries.map((e) => e.weight));
  const uniqueMax = entries.filter((e) => e.weight === maxWeight).length === 1;
  const prevIsUniqueMax =
    uniqueMax && entries.some((e) => e.name === previous && e.weight === maxWeight);
  const pool =
    entries.length > 1 && previous && !prevIsUniqueMax
      ? entries.filter((e) => e.name !== previous)
      : entries;
  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let r = random() * total;
  for (const e of pool) {
    r -= e.weight;
    if (r < 0) return e.name;
  }
  return pool[pool.length - 1].name;
}
