import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  canAddProfile,
  isAvatar,
  MAX_PROFILES,
  newProfileId,
  normalizeName,
  validateName,
  type AvatarId,
  type NameError,
  type Profile,
} from '@/domain/profiles';

export const PROFILES_STORAGE_KEY = 'app-one/profiles';
export const PROFILES_SCHEMA_VERSION = 1;

type PersistedProfiles = {
  profiles: Profile[];
  activeId: string | null;
};

type Result =
  { ok: true; id: string } | { ok: false; error: NameError | 'limitReached' | 'notFound' };

type ProfilesStore = PersistedProfiles & {
  addProfile: (name: string, avatar: AvatarId) => Result;
  updateProfile: (id: string, changes: { name: string; avatar: AvatarId }) => Result;
  deleteProfile: (id: string) => void;
  selectProfile: (id: string) => void;
};

/**
 * Cleans data loaded from storage: drops malformed or duplicate profiles, keeps at
 * most MAX_PROFILES and makes sure the active id points at a real profile.
 */
export function sanitizeProfiles(raw: unknown): PersistedProfiles {
  const input = (raw ?? {}) as Partial<Record<keyof PersistedProfiles, unknown>>;
  const list = Array.isArray(input.profiles) ? input.profiles : [];
  const profiles: Profile[] = [];
  for (const item of list) {
    const p = item as Partial<Profile> | null;
    if (
      p &&
      typeof p.id === 'string' &&
      typeof p.name === 'string' &&
      typeof p.createdAt === 'string' &&
      isAvatar(p.avatar) &&
      validateName(p.name, profiles) === null &&
      !profiles.some((q) => q.id === p.id)
    ) {
      profiles.push({ id: p.id, name: p.name, avatar: p.avatar, createdAt: p.createdAt });
    }
    if (profiles.length === MAX_PROFILES) break;
  }
  const activeId =
    typeof input.activeId === 'string' && profiles.some((p) => p.id === input.activeId)
      ? input.activeId
      : (profiles[0]?.id ?? null);
  return { profiles, activeId };
}

export const useProfiles = create<ProfilesStore>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeId: null,

      addProfile: (rawName, avatar) => {
        const { profiles } = get();
        if (!canAddProfile(profiles)) return { ok: false, error: 'limitReached' };
        const error = validateName(rawName, profiles);
        if (error) return { ok: false, error };
        const profile: Profile = {
          id: newProfileId(),
          name: normalizeName(rawName),
          avatar,
          createdAt: new Date().toISOString(),
        };
        set({ profiles: [...profiles, profile], activeId: profile.id });
        return { ok: true, id: profile.id };
      },

      updateProfile: (id, { name: rawName, avatar }) => {
        const { profiles } = get();
        if (!profiles.some((p) => p.id === id)) return { ok: false, error: 'notFound' };
        const error = validateName(rawName, profiles, id);
        if (error) return { ok: false, error };
        set({
          profiles: profiles.map((p) =>
            p.id === id ? { ...p, name: normalizeName(rawName), avatar } : p,
          ),
        });
        return { ok: true, id };
      },

      deleteProfile: (id) => {
        const { profiles, activeId } = get();
        const remaining = profiles.filter((p) => p.id !== id);
        set({
          profiles: remaining,
          activeId: activeId === id ? (remaining[0]?.id ?? null) : activeId,
        });
      },

      selectProfile: (id) => {
        if (get().profiles.some((p) => p.id === id)) set({ activeId: id });
      },
    }),
    {
      name: PROFILES_STORAGE_KEY,
      version: PROFILES_SCHEMA_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ profiles, activeId }) => ({ profiles, activeId }),
      // Older or unknown versions: keep whatever is still valid.
      migrate: (persisted) => sanitizeProfiles(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitizeProfiles(persisted) }),
    },
  ),
);

export function useActiveProfile(): Profile | null {
  return useProfiles((s) => s.profiles.find((p) => p.id === s.activeId) ?? null);
}

/** True once saved profiles have been loaded from the device. */
export function useProfilesHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useProfiles.persist.onFinishHydration(onChange),
    () => useProfiles.persist.hasHydrated(),
  );
}
