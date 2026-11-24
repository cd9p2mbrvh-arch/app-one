import { dayKey, meditationDay, sessionXp } from '../xp';

describe('sessionXp', () => {
  it('gives 10 per minute plus a bonus for a completed session', () => {
    expect(
      sessionXp({ plannedMinutes: 10, listenedMs: 600000, completed: true, firstToday: false }),
    ).toEqual({
      minutesXp: 100,
      completionBonus: 25,
      dailyBonus: 0,
      allPeriodsBonus: 0,
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
    ).toEqual({ minutesXp: 35, completionBonus: 0, dailyBonus: 0, allPeriodsBonus: 0, total: 35 });
  });

  it('gives nothing (not even the daily bonus) for under a minute', () => {
    expect(
      sessionXp({ plannedMinutes: 20, listenedMs: 59000, completed: false, firstToday: true })
        .total,
    ).toBe(0);
  });
});

describe('morning, noon and night bonus', () => {
  it('adds 50 XP when a completed session completes all three times of day', () => {
    expect(
      sessionXp({
        plannedMinutes: 5,
        listenedMs: 300000,
        completed: true,
        firstToday: false,
        completesAllPeriods: true,
      }),
    ).toMatchObject({ allPeriodsBonus: 50, total: 50 + 25 + 50 });
  });

  it('never applies to sessions ended early', () => {
    expect(
      sessionXp({
        plannedMinutes: 5,
        listenedMs: 240000,
        completed: false,
        firstToday: false,
        completesAllPeriods: true,
      }).allPeriodsBonus,
    ).toBe(0);
  });
});

describe('meditationDay', () => {
  it('runs from 05:00 to 05:00', () => {
    expect(meditationDay(new Date(2026, 0, 5, 5, 0))).toBe('2026-01-05');
    expect(meditationDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(meditationDay(new Date(2026, 0, 6, 1, 30))).toBe('2026-01-05');
    expect(meditationDay(new Date(2026, 0, 6, 4, 59))).toBe('2026-01-05');
  });
});

describe('dayKey', () => {
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
