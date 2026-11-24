import type { IconName } from '@/components';

/**
 * Everything the user can pick. To add a theme, voice or music track, add an entry
 * here (and its content files). `unlockLevel` hides nothing: locked items are still
 * shown on the wheel, with a padlock and the level that unlocks them.
 *
 * Later, paid packs (DLC) will add entries with an extra `pack` field.
 */
export type CatalogItem = {
  id: string;
  label: string;
  icon: IconName;
  /** Profile level needed to use this item. 1 = available from the start. */
  unlockLevel: number;
};

export const THEMES: CatalogItem[] = [
  { id: 'abundance', label: 'Abundance', icon: 'sparkles-outline', unlockLevel: 1 },
  { id: 'peace', label: 'Peace of Mind', icon: 'cloud-outline', unlockLevel: 1 },
  { id: 'health', label: 'Health', icon: 'leaf-outline', unlockLevel: 1 },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline', unlockLevel: 1 },
];

export const VOICES: CatalogItem[] = [
  { id: 'voice1', label: 'Voice 1', icon: 'mic-outline', unlockLevel: 1 },
  { id: 'voice2', label: 'Voice 2', icon: 'mic-outline', unlockLevel: 1 },
  { id: 'voice3', label: 'Voice 3', icon: 'mic-outline', unlockLevel: 1 },
  { id: 'voice4', label: 'Voice 4', icon: 'mic-outline', unlockLevel: 2 },
  { id: 'voice5', label: 'Voice 5', icon: 'mic-outline', unlockLevel: 3 },
  { id: 'voice6', label: 'Voice 6', icon: 'mic-outline', unlockLevel: 5 },
];

export const MUSIC: CatalogItem[] = [
  { id: 'music1', label: 'Music 1', icon: 'musical-notes-outline', unlockLevel: 1 },
  { id: 'music2', label: 'Music 2', icon: 'musical-notes-outline', unlockLevel: 1 },
  { id: 'music3', label: 'Music 3', icon: 'musical-notes-outline', unlockLevel: 2 },
  { id: 'music4', label: 'Music 4', icon: 'musical-notes-outline', unlockLevel: 4 },
];

export const MIN_DURATION_MIN = 3;
export const MAX_DURATION_MIN = 60;
export const DEFAULT_DURATION_MIN = 10;

export const DURATIONS_MIN: number[] = Array.from(
  { length: MAX_DURATION_MIN - MIN_DURATION_MIN + 1 },
  (_, i) => MIN_DURATION_MIN + i,
);

export function isUnlocked(item: Pick<CatalogItem, 'unlockLevel'>, level: number): boolean {
  return level >= item.unlockLevel;
}

export function firstUnlocked(items: CatalogItem[], level: number): CatalogItem {
  const item = items.find((i) => isUnlocked(i, level));
  if (!item) throw new Error('Every category needs at least one item unlocked at level 1');
  return item;
}

/** Number of shared lines per theme and own lines per voice per theme. */
export const SHARED_LINES_PER_THEME = 100;
export const VOICE_LINES_PER_THEME = 30;
