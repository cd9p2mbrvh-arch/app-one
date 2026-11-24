/**
 * XP for a session (v1, to be refined):
 * - completed: 10 XP per planned minute + 25 completion bonus;
 * - ended early: 5 XP per full minute listened, no bonus;
 * - under one minute: nothing;
 * - first session of the day that earns XP: +15.
 */
export const XP_PER_MINUTE = 10;
export const XP_PER_MINUTE_EARLY = 5;
export const COMPLETION_BONUS = 25;
export const DAILY_BONUS = 15;

export type SessionXp = {
  minutesXp: number;
  completionBonus: number;
  dailyBonus: number;
  total: number;
};

export function sessionXp({
  plannedMinutes,
  listenedMs,
  completed,
  firstToday,
}: {
  plannedMinutes: number;
  listenedMs: number;
  completed: boolean;
  firstToday: boolean;
}): SessionXp {
  const fullMinutes = Math.floor(Math.max(0, listenedMs) / 60000);
  const minutesXp = completed ? plannedMinutes * XP_PER_MINUTE : fullMinutes * XP_PER_MINUTE_EARLY;
  const completionBonus = completed ? COMPLETION_BONUS : 0;
  const dailyBonus = firstToday && minutesXp > 0 ? DAILY_BONUS : 0;
  return {
    minutesXp,
    completionBonus,
    dailyBonus,
    total: minutesXp + completionBonus + dailyBonus,
  };
}

/** Local calendar day, e.g. "2026-11-24". */
export function dayKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
