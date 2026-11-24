/**
 * Which affirmation comes next, and when.
 *
 * - Lines play in a shuffled order with no repeats.
 * - If a long session uses every line, a new shuffled round starts, arranged so
 *   the most recently heard lines (up to RECENT_WINDOW) come last in that round.
 * - After a line finishes there is a random quiet gap of 10–20 seconds.
 * - No new line starts in the last few seconds of a session.
 */
export const GAP_MS: [number, number] = [10000, 20000];
export const RECENT_WINDOW = 50;
export const MIN_REMAINING_FOR_LINE_MS = 8000;
/** Quiet time at the very start, and after resuming from a pause. */
export const INTRO_MS = 4000;

type Random = () => number;

export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function gapMs(random: Random): number {
  const [min, max] = GAP_MS;
  return Math.round(min + (max - min) * random());
}

export function canStartLine(elapsedMs: number, durationMs: number): boolean {
  return durationMs - elapsedMs >= MIN_REMAINING_FOR_LINE_MS;
}

/** A never-ending queue of line ids following the rules above. */
export function createLineQueue(ids: readonly string[], random: Random) {
  const window = Math.min(RECENT_WINDOW, Math.floor(ids.length / 2));
  const recent: string[] = [];
  let round: string[] = shuffle(ids, random);

  return {
    next(): string | undefined {
      if (ids.length === 0) return undefined;
      if (round.length === 0) {
        const recentSet = new Set(recent);
        round = [
          ...shuffle(
            ids.filter((id) => !recentSet.has(id)),
            random,
          ),
          ...shuffle(
            ids.filter((id) => recentSet.has(id)),
            random,
          ),
        ];
      }
      const id = round.shift()!;
      recent.push(id);
      if (recent.length > window) recent.shift();
      return id;
    },
  };
}
