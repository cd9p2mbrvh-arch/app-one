import type { IconName } from '@/components';

// Temporary hard-coded catalogue. Replaced by the content manifest in M3.

export type CatalogItem = { id: string; label: string; icon: IconName };

export const THEMES: CatalogItem[] = [
  { id: 'abundance', label: 'Abundance', icon: 'sparkles-outline' },
  { id: 'peace', label: 'Peace of Mind', icon: 'cloud-outline' },
  { id: 'health', label: 'Health', icon: 'leaf-outline' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline' },
];

export const VOICES: CatalogItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `voice${i + 1}`,
  label: `Voice ${i + 1}`,
  icon: 'mic-outline',
}));

export const MUSIC: CatalogItem[] = Array.from({ length: 4 }, (_, i) => ({
  id: `music${i + 1}`,
  label: `Music ${i + 1}`,
  icon: 'musical-notes-outline',
}));

export const MIN_DURATION_MIN = 3;
export const MAX_DURATION_MIN = 60;

/** Quick picks until the duration wheel arrives in M5. */
export const DURATION_PRESETS_MIN = [3, 5, 10, 15, 20, 30, 45, 60];
