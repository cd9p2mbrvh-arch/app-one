import type { IconName } from '@/components';

export const MAX_PROFILES = 4;
export const MAX_NAME_LENGTH = 20;

/** Symbols a profile can use as its avatar. */
export const AVATARS = [
  'sunny',
  'moon',
  'leaf',
  'flower',
  'star',
  'water',
  'paw',
  'planet',
] as const satisfies readonly IconName[];

export type AvatarId = (typeof AVATARS)[number];

export type Profile = {
  id: string;
  name: string;
  avatar: AvatarId;
  /** ISO timestamp */
  createdAt: string;
};

export type NameError = 'empty' | 'tooLong' | 'invalidCharacters' | 'duplicate';

export const NAME_ERROR_MESSAGES: Record<NameError, string> = {
  empty: 'Please enter a name.',
  tooLong: `Names can be at most ${MAX_NAME_LENGTH} characters.`,
  invalidCharacters: 'Use letters, numbers, spaces, apostrophes, dots or dashes.',
  duplicate: 'Another profile already has this name.',
};

/** Letters and numbers in any language, plus space, apostrophe, dot and dash. */
const ALLOWED_NAME = /^[\p{L}\p{M}\p{N} '’.-]+$/u;

/** Trims and collapses inner whitespace. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

/**
 * Checks a profile name. `existing` are the other profiles; `ignoreId` lets a
 * profile keep its own name while being edited.
 */
export function validateName(
  raw: string,
  existing: Pick<Profile, 'id' | 'name'>[],
  ignoreId?: string,
): NameError | null {
  const name = normalizeName(raw);
  if (name.length === 0) return 'empty';
  if ([...name].length > MAX_NAME_LENGTH) return 'tooLong';
  if (!ALLOWED_NAME.test(name)) return 'invalidCharacters';
  const lower = name.toLocaleLowerCase();
  if (existing.some((p) => p.id !== ignoreId && p.name.toLocaleLowerCase() === lower)) {
    return 'duplicate';
  }
  return null;
}

export function canAddProfile(profiles: unknown[]): boolean {
  return profiles.length < MAX_PROFILES;
}

export function isAvatar(value: unknown): value is AvatarId {
  return typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
}

/** Short random id; profiles are local-only so global uniqueness is not required. */
export function newProfileId(random: () => number = Math.random, now: () => number = Date.now) {
  return `${now().toString(36)}-${Math.floor(random() * 36 ** 6).toString(36)}`;
}
