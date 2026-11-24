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

/**
 * Narrators (internally "voices"). Until real recordings exist, samples and
 * sessions use the device's text-to-speech with these settings.
 */
export type Narrator = CatalogItem & {
  /** One-line description shown when the narrator is in the spotlight. */
  tagline: string;
  /** Placeholder portrait colour until real portraits exist. */
  accent: string;
  speech: { pitch: number; rate: number };
  /** Short sentence played when the narrator is chosen. */
  sample: string;
};

const narrator = (
  n: number,
  unlockLevel: number,
  tagline: string,
  accent: string,
  pitch: number,
  rate: number,
): Narrator => ({
  id: `voice${n}`,
  label: `Narrator ${n}`,
  icon: 'person',
  unlockLevel,
  tagline,
  accent,
  speech: { pitch, rate },
  sample: `Hello, I am Narrator ${n}. Breathe in slowly, and let yourself relax.`,
});

export const VOICES: Narrator[] = [
  narrator(1, 1, 'Warm and gentle', '#8FA9C8', 1.0, 0.9),
  narrator(2, 1, 'Calm and deep', '#C49A7A', 0.85, 0.85),
  narrator(3, 1, 'Bright and clear', '#9DB59A', 1.15, 0.95),
  narrator(4, 2, 'Soft and soothing', '#B79CC4', 1.05, 0.8),
  narrator(5, 3, 'Steady and grounded', '#C7B27A', 0.9, 0.9),
  narrator(6, 5, 'Slow and serene', '#7FB3B0', 0.95, 0.75),
];

export type MusicTrack = CatalogItem & {
  /** Short mood description, e.g. "Soft pads · Calm". */
  mood: string;
  accent: string;
  /** Bundled audio file (a seamless loop). */
  source: number;
};

export const MUSIC: MusicTrack[] = [
  {
    id: 'music1',
    label: 'Music 1',
    icon: 'musical-notes-outline',
    unlockLevel: 1,
    mood: 'Soft pads · Calm',
    accent: '#8FA9C8',
    source: require('../../assets/music/music1.m4a'),
  },
  {
    id: 'music2',
    label: 'Music 2',
    icon: 'water-outline',
    unlockLevel: 1,
    mood: 'Ocean waves · Drone',
    accent: '#7FB3B0',
    source: require('../../assets/music/music2.m4a'),
  },
  {
    id: 'music3',
    label: 'Music 3',
    icon: 'musical-note-outline',
    unlockLevel: 2,
    mood: 'Warm strings · Slow',
    accent: '#C49A7A',
    source: require('../../assets/music/music3.m4a'),
  },
  {
    id: 'music4',
    label: 'Music 4',
    icon: 'moon-outline',
    unlockLevel: 4,
    mood: 'Night bells · Sparse',
    accent: '#B79CC4',
    source: require('../../assets/music/music4.m4a'),
  },
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
