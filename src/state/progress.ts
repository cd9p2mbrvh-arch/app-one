import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { levelForXp } from '@/domain/progress';
import { dayKey, sessionXp, type SessionXp } from '@/domain/xp';

export const PROGRESS_STORAGE_KEY = 'app-one/progress';

export type SessionResult = {
  completed: boolean;
  plannedMinutes: number;
  listenedMs: number;
  themeId: string;
  xp: SessionXp;
  xpBefore: number;
  xpAfter: number;
  levelBefore: number;
  levelAfter: number;
  /** ISO timestamp */
  endedAt: string;
};

export type ProfileProgress = {
  totalXp: number;
  sessions: number;
  totalMinutes: number;
  /** Local day of the last session that earned XP, e.g. "2026-11-24". */
  lastXpDay: string | null;
  lastResult: SessionResult | null;
};

const EMPTY: ProfileProgress = {
  totalXp: 0,
  sessions: 0,
  totalMinutes: 0,
  lastXpDay: null,
  lastResult: null,
};

type ProgressStore = {
  byProfile: Record<string, ProfileProgress>;
  recordSession: (
    profileId: string,
    session: {
      completed: boolean;
      plannedMinutes: number;
      listenedMs: number;
      themeId: string;
      now?: Date;
    },
  ) => SessionResult;
  removeProfile: (profileId: string) => void;
};

export function progressOf(
  byProfile: Record<string, ProfileProgress>,
  profileId: string | null | undefined,
): ProfileProgress {
  return (profileId && byProfile[profileId]) || EMPTY;
}

function sanitize(raw: unknown): Record<string, ProfileProgress> {
  const input = (raw as { byProfile?: unknown } | null)?.byProfile;
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, ProfileProgress> = {};
  for (const [id, value] of Object.entries(input as Record<string, Partial<ProfileProgress>>)) {
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0);
    out[id] = {
      totalXp: n(value?.totalXp),
      sessions: n(value?.sessions),
      totalMinutes: n(value?.totalMinutes),
      lastXpDay: typeof value?.lastXpDay === 'string' ? value.lastXpDay : null,
      lastResult: value?.lastResult ?? null,
    };
  }
  return out;
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      byProfile: {},

      recordSession: (
        profileId,
        { completed, plannedMinutes, listenedMs, themeId, now = new Date() },
      ) => {
        const before = progressOf(get().byProfile, profileId);
        const today = dayKey(now);
        const xp = sessionXp({
          plannedMinutes,
          listenedMs,
          completed,
          firstToday: before.lastXpDay !== today,
        });
        const xpAfter = before.totalXp + xp.total;
        const result: SessionResult = {
          completed,
          plannedMinutes,
          listenedMs,
          themeId,
          xp,
          xpBefore: before.totalXp,
          xpAfter,
          levelBefore: levelForXp(before.totalXp),
          levelAfter: levelForXp(xpAfter),
          endedAt: now.toISOString(),
        };
        set({
          byProfile: {
            ...get().byProfile,
            [profileId]: {
              totalXp: xpAfter,
              sessions: before.sessions + 1,
              totalMinutes: before.totalMinutes + Math.floor(listenedMs / 60000),
              lastXpDay: xp.total > 0 ? today : before.lastXpDay,
              lastResult: result,
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
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ byProfile }) => ({ byProfile }),
      migrate: (persisted) => ({ byProfile: sanitize(persisted) }),
      merge: (persisted, current) => ({ ...current, byProfile: sanitize(persisted) }),
    },
  ),
);

/** Progress of one profile (empty progress for unknown profiles). */
export function useProfileProgress(profileId: string | null | undefined): ProfileProgress {
  return useProgress((s) => progressOf(s.byProfile, profileId));
}
