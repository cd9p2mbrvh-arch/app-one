/** "mm:ss" for a number of milliseconds, rounding up so 0:00.4 shows as 00:01. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Tue 24 Nov · 21:14" in local time. (English for now.) */
export function formatSessionDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} · ${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** "10 min" for a completed session, "4 of 20 min" for one ended early. */
export function formatSessionLength(
  completed: boolean,
  plannedMinutes: number,
  listenedMs: number,
): string {
  if (completed) return `${plannedMinutes} min`;
  const minutes = Math.floor(listenedMs / 60000);
  return minutes > 0 ? `${minutes} of ${plannedMinutes} min` : `under 1 of ${plannedMinutes} min`;
}
