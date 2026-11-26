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
  /**
   * Set for paid items: unlocked by a one-time purchase instead of by level.
   * `productId` will be the App Store / Google Play product identifier.
   */
  purchase?: { productId: string; priceLabel: string };
};

/** Why an item cannot be used yet, or null when it can. */
export type LockReason =
  { kind: 'level'; level: number } | { kind: 'purchase'; priceLabel: string };

/** No purchases (the default for code that does not track them). */
export const NO_PURCHASES: ReadonlySet<string> = new Set();

/** Placeholder price for paid content (real prices will come from the stores). */
export const PAID_PRICE_LABEL = '$1';

/**
 * A meditation theme. A theme may come with its own narrator and/or music
 * (`fixed`): while it is selected those are chosen automatically and cannot be
 * changed — even if they would normally be locked, since they come with the theme.
 * (No theme uses this yet.)
 */
export type Theme = CatalogItem & {
  fixed?: { voice?: string; music?: string };
  /** Light colour of the theme's glossy icon tile (falls back to the look's primary). */
  accent?: string;
};

export const THEMES: Theme[] = [
  {
    id: 'abundance',
    label: 'Abundance',
    icon: 'sparkles-outline',
    unlockLevel: 1,
    accent: '#E5BE62',
  },
  { id: 'peace', label: 'Peace of Mind', icon: 'cloud-outline', unlockLevel: 1, accent: '#8EBCE6' },
  { id: 'health', label: 'Health', icon: 'leaf-outline', unlockLevel: 1, accent: '#93C98C' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline', unlockLevel: 1, accent: '#E99DB1' },
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
  paid = false,
): Narrator => ({
  id: `voice${n}`,
  label: `Narrator ${n}`,
  icon: 'person',
  unlockLevel,
  ...(paid ? { purchase: { productId: `narrator.voice${n}`, priceLabel: PAID_PRICE_LABEL } } : {}),
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
  // Paid narrators (one-time purchase each).
  narrator(7, 1, 'Whisper soft', '#D49AAE', 1.1, 0.78, true),
  narrator(8, 1, 'Deep and resonant', '#8E8FC7', 0.8, 0.82, true),
  narrator(9, 1, 'Bright and uplifting', '#E0B26A', 1.2, 0.92, true),
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
  // Paid music (one-time purchase each).
  {
    id: 'music5',
    label: 'Music 5',
    icon: 'rainy-outline',
    unlockLevel: 1,
    purchase: { productId: 'music.music5', priceLabel: PAID_PRICE_LABEL },
    mood: 'Gentle rain · Pad',
    accent: '#7E9CB8',
    source: require('../../assets/music/music5.m4a'),
  },
  {
    id: 'music6',
    label: 'Music 6',
    icon: 'radio-button-on-outline',
    unlockLevel: 1,
    purchase: { productId: 'music.music6', priceLabel: PAID_PRICE_LABEL },
    mood: 'Singing bowls · Deep',
    accent: '#B08E6E',
    source: require('../../assets/music/music6.m4a'),
  },
  {
    id: 'music7',
    label: 'Music 7',
    icon: 'leaf-outline',
    unlockLevel: 1,
    purchase: { productId: 'music.music7', priceLabel: PAID_PRICE_LABEL },
    mood: 'Morning birds · Light',
    accent: '#8DB38B',
    source: require('../../assets/music/music7.m4a'),
  },
];

export const MIN_DURATION_MIN = 5;
export const MAX_DURATION_MIN = 30;
export const DEFAULT_DURATION_MIN = 10;

export const DURATIONS_MIN: number[] = Array.from(
  { length: MAX_DURATION_MIN - MIN_DURATION_MIN + 1 },
  (_, i) => MIN_DURATION_MIN + i,
);

export function lockReason(
  item: Pick<CatalogItem, 'unlockLevel' | 'purchase'>,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
): LockReason | null {
  if (item.purchase) {
    return owned.has(item.purchase.productId)
      ? null
      : { kind: 'purchase', priceLabel: item.purchase.priceLabel };
  }
  return level >= item.unlockLevel ? null : { kind: 'level', level: item.unlockLevel };
}

export function isUnlocked(
  item: Pick<CatalogItem, 'unlockLevel' | 'purchase'>,
  level: number,
  owned: ReadonlySet<string> = NO_PURCHASES,
): boolean {
  return lockReason(item, level, owned) === null;
}

export function firstUnlocked(items: CatalogItem[], level: number): CatalogItem {
  const item = items.find((i) => isUnlocked(i, level));
  if (!item) throw new Error('Every category needs at least one item unlocked at level 1');
  return item;
}

/** Number of shared lines per theme and own lines per voice per theme. */
export const SHARED_LINES_PER_THEME = 100;
export const VOICE_LINES_PER_THEME = 30;
