import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { levelForXp } from '@/domain/progress';
import { meditationDay, sessionXp, type SessionXp } from '@/domain/xp';
import { getTimeOfDay, type TimeOfDay } from '@/theme/timeOfDay';

export const PROGRESS_STORAGE_KEY = 'app-one/progress';
export const PROGRESS_SCHEMA_VERSION = 2;
export const HISTORY_LIMIT = 500;
export const PERIODS: TimeOfDay[] = ['morning', 'noon', 'night'];

/** One finished session, as shown in the history. */
export type SessionRecord = {
  id: string;
  /** ISO timestamp */
  endedAt: string;
  themeId: string;
  voiceId: string;
  musicId: string;
  plannedMinutes: number;
  listenedMs: number;
  completed: boolean;
  /** Time of day by the real clock when the session ended. */
  period: TimeOfDay;
  xp: number;
};

export type SessionResult = {
  completed: boolean;
  plannedMinutes: number;
  listenedMs: number;
  themeId: string;
  period: TimeOfDay;
  xp: SessionXp;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  /** Times of day completed so far on this meditation day (after this session). */
  periodsToday: TimeOfDay[];
  /** ISO timestamp */
  endedAt: string;
};

export type ProfileProgress = {
  totalXp: number;
  sessions: number;
  totalMinutes: number;
  /** Meditation day of the last session that earned XP, e.g. "2026-11-24". */
  lastXpDay: string | null;
  /** Times of day with a completed session on `today.day`. */
  today: { day: string; periods: TimeOfDay[]; bonusAwarded: boolean } | null;
  lastResult: SessionResult | null;
  /** Newest first. */
  history: SessionRecord[];
};

const EMPTY: ProfileProgress = {
  totalXp: 0,
  sessions: 0,
  totalMinutes: 0,
  lastXpDay: null,
  today: null,
  lastResult: null,
  history: [],
};

type NewSession = {
  completed: boolean;
  plannedMinutes: number;
  listenedMs: number;
  themeId: string;
  voiceId: string;
  musicId: string;
  now?: Date;
};

type ProgressStore = {
  byProfile: Record<string, ProfileProgress>;
  recordSession: (profileId: string, session: NewSession) => SessionResult;
  removeProfile: (profileId: string) => void;
};

export function progressOf(
  byProfile: Record<string, ProfileProgress>,
  profileId: string | null | undefined,
): ProfileProgress {
  return (profileId && byProfile[profileId]) || EMPTY;
}

/** Times of day completed on the current meditation day (empty if it's a new day). */
export function periodsToday(progress: ProfileProgress, now: Date = new Date()): TimeOfDay[] {
  return progress.today?.day === meditationDay(now) ? progress.today.periods : [];
}

const isPeriod = (v: unknown): v is TimeOfDay => PERIODS.includes(v as TimeOfDay);

function sanitizeRecord(raw: unknown): SessionRecord | null {
  const r = raw as Partial<SessionRecord> | null;
  if (!r || typeof r.id !== 'string' || typeof r.endedAt !== 'string') return null;
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
  return {
    id: r.id,
    endedAt: r.endedAt,
    themeId: typeof r.themeId === 'string' ? r.themeId : '',
    voiceId: typeof r.voiceId === 'string' ? r.voiceId : '',
    musicId: typeof r.musicId === 'string' ? r.musicId : '',
    plannedMinutes: n(r.plannedMinutes),
    listenedMs: n(r.listenedMs),
    completed: r.completed === true,
    period: isPeriod(r.period) ? r.period : 'morning',
    xp: n(r.xp),
  };
}

function sanitize(raw: unknown): Record<string, ProfileProgress> {
  const input = (raw as { byProfile?: unknown } | null)?.byProfile;
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, ProfileProgress> = {};
  for (const [id, value] of Object.entries(input as Record<string, Partial<ProfileProgress>>)) {
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    const today = value?.today;
    out[id] = {
      totalXp: n(value?.totalXp),
      sessions: n(value?.sessions),
      totalMinutes: n(value?.totalMinutes),
      lastXpDay: typeof value?.lastXpDay === 'string' ? value.lastXpDay : null,
      today:
        today && typeof today.day === 'string' && Array.isArray(today.periods)
          ? {
              day: today.day,
              periods: today.periods.filter(isPeriod),
              bonusAwarded: today.bonusAwarded === true,
            }
          : null,
      lastResult: value?.lastResult ?? null,
      history: Array.isArray(value?.history)
        ? value.history
            .map(sanitizeRecord)
            .filter((r): r is SessionRecord => r !== null)
            .slice(0, HISTORY_LIMIT)
        : [],
    };
  }
  return out;
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      byProfile: {},

      recordSession: (profileId, { now = new Date(), ...session }) => {
        const before = progressOf(get().byProfile, profileId);
        const day = meditationDay(now);
        const period = getTimeOfDay(now);

        // Times of day completed today, including this session if it was completed.
        const earlier = periodsToday(before, now);
        const periods =
          session.completed && !earlier.includes(period) ? [...earlier, period] : earlier;
        const alreadyAwarded = before.today?.day === day && before.today.bonusAwarded;
        const completesAllPeriods =
          session.completed && !alreadyAwarded && PERIODS.every((p) => periods.includes(p));

        const xp = sessionXp({
          plannedMinutes: session.plannedMinutes,
          listenedMs: session.listenedMs,
          completed: session.completed,
          firstToday: before.lastXpDay !== day,
          completesAllPeriods,
        });
        const xpAfter = before.totalXp + xp.total;
        const endedAt = now.toISOString();
        const result: SessionResult = {
          completed: session.completed,
          plannedMinutes: session.plannedMinutes,
          listenedMs: session.listenedMs,
          themeId: session.themeId,
          period,
          xp,
          xpBefore: before.totalXp,
          xpAfter,
          levelBefore: levelForXp(before.totalXp),
          levelAfter: levelForXp(xpAfter),
          periodsToday: PERIODS.filter((p) => periods.includes(p)),
          endedAt,
        };
        const record: SessionRecord = {
          id: `${now.getTime().toString(36)}-${before.sessions}`,
          endedAt,
          themeId: session.themeId,
          voiceId: session.voiceId,
          musicId: session.musicId,
          plannedMinutes: session.plannedMinutes,
          listenedMs: session.listenedMs,
          completed: session.completed,
          period,
          xp: xp.total,
        };
        set({
          byProfile: {
            ...get().byProfile,
            [profileId]: {
              totalXp: xpAfter,
              sessions: before.sessions + 1,
              totalMinutes: before.totalMinutes + Math.floor(session.listenedMs / 60000),
              lastXpDay: xp.total > 0 ? day : before.lastXpDay,
              today: { day, periods, bonusAwarded: alreadyAwarded || completesAllPeriods },
              lastResult: result,
              history: [record, ...before.history].slice(0, HISTORY_LIMIT),
            },
          },
        });
        return result;
      },

      removeProfile: (profileId) => {
        const { [profileId]: _removed, ...rest } = get().byProfile;
        set({ byProfile: rest });
      },
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      version: PROGRESS_SCHEMA_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byProfile }) => ({ byProfile }),
      // Version 1 had no history or times of day; sanitize fills in the gaps.
      migrate: (persisted) => ({ byProfile: sanitize(persisted) }),
      merge: (persisted, current) => ({ ...current, byProfile: sanitize(persisted) }),
    },
  ),
);

/** Progress of one profile (empty progress for unknown profiles). */
export function useProfileProgress(profileId: string | null | undefined): ProfileProgress {
  return useProgress((s) => progressOf(s.byProfile, profileId));
}
