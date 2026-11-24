/**
 * XP for a session (v1, to be refined):
 * - completed: 10 XP per planned minute + 25 completion bonus;
 * - ended early: 5 XP per full minute listened, no bonus;
 * - under one minute: nothing;
 * - first session of the day that earns XP: +15;
 * - completed sessions in the morning, at noon and at night on the same day:
 *   +50 when the third one is completed.
 *
 * A meditation day runs from 05:00 to 05:00, so a session at 1 am still counts
 * as that night (see meditationDay).
 */
export const XP_PER_MINUTE = 10;
export const XP_PER_MINUTE_EARLY = 5;
export const COMPLETION_BONUS = 25;
export const DAILY_BONUS = 15;
export const ALL_PERIODS_BONUS = 50;
/** Hour at which a new meditation day starts (matches the start of "morning"). */
export const DAY_STARTS_AT_HOUR = 5;

export type SessionXp = {
  minutesXp: number;
  completionBonus: number;
  dailyBonus: number;
  allPeriodsBonus: number;
  total: number;
};

export function sessionXp({
  plannedMinutes,
  listenedMs,
  completed,
  firstToday,
  completesAllPeriods = false,
}: {
  plannedMinutes: number;
  listenedMs: number;
  completed: boolean;
  firstToday: boolean;
  /** This completed session is the day's last missing morning/noon/night one. */
  completesAllPeriods?: boolean;
}): SessionXp {
  const fullMinutes = Math.floor(Math.max(0, listenedMs) / 60000);
  const minutesXp = completed ? plannedMinutes * XP_PER_MINUTE : fullMinutes * XP_PER_MINUTE_EARLY;
  const completionBonus = completed ? COMPLETION_BONUS : 0;
  const dailyBonus = firstToday && minutesXp > 0 ? DAILY_BONUS : 0;
  const allPeriodsBonus = completed && completesAllPeriods ? ALL_PERIODS_BONUS : 0;
  return {
    minutesXp,
    completionBonus,
    dailyBonus,
    allPeriodsBonus,
    total: minutesXp + completionBonus + dailyBonus + allPeriodsBonus,
  };
}

/** Local calendar day, e.g. "2026-11-24". */
export function dayKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** The meditation day a moment belongs to: days run from 05:00 to 05:00. */
export function meditationDay(date: Date): string {
  return dayKey(new Date(date.getTime() - DAY_STARTS_AT_HOUR * 3600 * 1000));
}
