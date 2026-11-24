import { dayKey, sessionXp } from '../xp';

describe('sessionXp', () => {
  it('gives 10 per minute plus a bonus for a completed session', () => {
    expect(
      sessionXp({ plannedMinutes: 10, listenedMs: 600000, completed: true, firstToday: false }),
    ).toEqual({
      minutesXp: 100,
      completionBonus: 25,
      dailyBonus: 0,
      total: 125,
    });
  });

  it('adds the daily bonus to the first session of the day', () => {
    expect(
      sessionXp({ plannedMinutes: 3, listenedMs: 180000, completed: true, firstToday: true }).total,
    ).toBe(30 + 25 + 15);
  });

  it('gives 5 per full minute and no bonus when ended early', () => {
    expect(
      sessionXp({
        plannedMinutes: 20,
        listenedMs: 7.9 * 60000,
        completed: false,
        firstToday: false,
      }),
    ).toEqual({ minutesXp: 35, completionBonus: 0, dailyBonus: 0, total: 35 });
  });

  it('gives nothing (not even the daily bonus) for under a minute', () => {
    expect(
      sessionXp({ plannedMinutes: 20, listenedMs: 59000, completed: false, firstToday: true })
        .total,
    ).toBe(0);
  });
});

describe('dayKey', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
