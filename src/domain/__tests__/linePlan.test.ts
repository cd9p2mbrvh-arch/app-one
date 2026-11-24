import {
  canStartLine,
  createLineQueue,
  gapMs,
  MIN_REMAINING_FOR_LINE_MS,
  RECENT_WINDOW,
  shuffle,
} from '../linePlan';
import { seededRandom } from '@/components/background/motion';

const ids = Array.from({ length: 130 }, (_, i) => `line${i}`);

describe('shuffle', () => {
  it('keeps every item exactly once', () => {
    const out = shuffle(ids, seededRandom(1));
    expect([...out].sort()).toEqual([...ids].sort());
    expect(out).not.toEqual(ids);
  });
});

describe('createLineQueue', () => {
  it('plays every line once before any repeat', () => {
    const q = createLineQueue(ids, seededRandom(2));
    const first = Array.from({ length: ids.length }, () => q.next());
    expect(new Set(first).size).toBe(ids.length);
  });

  it(`never repeats any of the last ${RECENT_WINDOW} lines, even in very long sessions`, () => {
    const q = createLineQueue(ids, seededRandom(3));
    const played = Array.from({ length: 1000 }, () => q.next()!);
    for (let i = 0; i < played.length; i++) {
      const window = played.slice(Math.max(0, i - RECENT_WINDOW), i);
      expect(window).not.toContain(played[i]);
    }
  });

  it('copes with very few lines and with none', () => {
    const q = createLineQueue(['a', 'b'], seededRandom(4));
    const played = Array.from({ length: 6 }, () => q.next());
    for (let i = 1; i < played.length; i++) expect(played[i]).not.toBe(played[i - 1]);
    expect(createLineQueue([], seededRandom(5)).next()).toBeUndefined();
  });
});

describe('timing', () => {
  it('waits 10–20 seconds between lines', () => {
    expect(gapMs(() => 0)).toBe(10000);
    expect(gapMs(() => 0.5)).toBe(15000);
    expect(gapMs(() => 0.9999)).toBeLessThanOrEqual(20000);
    expect(gapMs(() => 0.9999)).toBeGreaterThan(19900);
  });

  it('does not start a line in the last seconds of a session', () => {
    expect(canStartLine(0, 60000)).toBe(true);
    expect(canStartLine(60000 - MIN_REMAINING_FOR_LINE_MS, 60000)).toBe(true);
    expect(canStartLine(60000 - MIN_REMAINING_FOR_LINE_MS + 1, 60000)).toBe(false);
  });
});
