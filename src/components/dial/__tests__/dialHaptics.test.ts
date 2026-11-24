import { FAST_MINUTES_PER_SECOND, hapticForStep, MIN_GAP_MS, speedBetween } from '../dialHaptics';

const slow = 3;
const fast = FAST_MINUTES_PER_SECOND + 10;

describe('hapticForStep', () => {
  it('ticks lightly on each minute when moving slowly', () => {
    expect(hapticForStep({ value: 11, now: 1000, lastHapticAt: 0, speed: slow })).toBe('minor');
  });

  it('ticks more firmly on 5-minute marks', () => {
    expect(hapticForStep({ value: 15, now: 1000, lastHapticAt: 0, speed: slow })).toBe('major');
  });

  it('skips minute ticks while spinning fast but keeps 5-minute marks', () => {
    expect(hapticForStep({ value: 23, now: 1000, lastHapticAt: 0, speed: fast })).toBeNull();
    expect(hapticForStep({ value: 25, now: 1000, lastHapticAt: 0, speed: fast })).toBe('major');
  });

  it('never fires minute ticks closer together than the minimum gap', () => {
    expect(
      hapticForStep({ value: 12, now: 1000, lastHapticAt: 1000 - MIN_GAP_MS + 1, speed: slow }),
    ).toBeNull();
    expect(
      hapticForStep({ value: 12, now: 1000, lastHapticAt: 1000 - MIN_GAP_MS, speed: slow }),
    ).toBe('minor');
  });

  it('gives an even rhythm for a fast spin from 10 to 60', () => {
    // 50 minutes in 1 second: one change every 20 ms.
    let last = -Infinity;
    const fired: number[] = [];
    for (let v = 11; v <= 60; v++) {
      const now = (v - 10) * 20;
      const h = hapticForStep({ value: v, now, lastHapticAt: last, speed: 50 });
      if (h) {
        fired.push(v);
        last = now;
      }
    }
    expect(fired).toEqual([15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
  });
});

describe('speedBetween', () => {
  it('measures minutes per second', () => {
    expect(speedBetween(10, 0, 20, 1000)).toBe(10);
    expect(speedBetween(20, 0, 10, 500)).toBe(20);
    expect(speedBetween(10, 5, 11, 5)).toBe(0);
  });
});
