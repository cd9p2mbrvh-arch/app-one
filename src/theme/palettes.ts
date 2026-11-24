import type { TimeOfDay } from './timeOfDay';

/**
 * Colours for one time of day. Translucent colours (#RRGGBBAA) are allowed for
 * surfaces so the background gradient shows through, like frosted glass.
 * Every palette must pass the contrast checks in `__tests__/palettes.test.ts`.
 */
export type Palette = {
  /** Status bar icon colour */
  statusBar: 'dark' | 'light';
  /** Main text */
  text: string;
  /** Secondary text (captions, hints) */
  textMuted: string;
  /** Cards, tiles and tabs (may be translucent) */
  surface: string;
  /** Card borders and the 3D "edge" under cards (may be translucent) */
  border: string;
  /** Main action colour (buttons, progress fill, selected items) */
  primary: string;
  /** 3D edge under primary buttons */
  primaryEdge: string;
  /** Text and icons placed on `primary` */
  onPrimary: string;
  /** Unfilled part of progress bars (may be translucent) */
  track: string;
  /** Small highlights such as XP labels */
  accent: string;
};

/** A soft, blurred colour spot. Position and radius are fractions of the screen size. */
export type Blob = { color: string; cx: number; cy: number; r: number };

export type Backdrop = {
  /** Top-to-bottom base gradient */
  gradient: [string, string, string];
  /** Soft colour spots layered over the gradient */
  blobs: Blob[];
};

export type Look = { colors: Palette; backdrop: Backdrop };

export const looks: Record<TimeOfDay, Look> = {
  morning: {
    colors: {
      statusBar: 'dark',
      text: '#26323C',
      textMuted: '#425160',
      surface: '#FFFFFFB3',
      border: '#B9C9D6',
      primary: '#5B7083',
      primaryEdge: '#465969',
      onPrimary: '#FFFFFF',
      track: '#FFFFFF99',
      accent: '#41566A',
    },
    backdrop: {
      gradient: ['#E3EEF8', '#F3F7FB', '#FFFFFF'],
      blobs: [
        { color: '#C9DDF2', cx: 0.15, cy: 0.12, r: 0.55 },
        { color: '#E4E6FA', cx: 0.95, cy: 0.4, r: 0.5 },
        { color: '#D6EAF5', cx: 0.3, cy: 0.9, r: 0.6 },
      ],
    },
  },
  noon: {
    colors: {
      statusBar: 'dark',
      text: '#3A2E22',
      textMuted: '#523F2D',
      surface: '#FFFFFFA6',
      border: '#E2BE8C',
      primary: '#94643A',
      primaryEdge: '#764E2B',
      onPrimary: '#FFFFFF',
      track: '#FFFFFF8C',
      accent: '#6B4523',
    },
    backdrop: {
      gradient: ['#FFE2B8', '#FFEFD6', '#FFF8EC'],
      blobs: [
        { color: '#FFC98C', cx: 0.85, cy: 0.1, r: 0.6 },
        { color: '#FFE59E', cx: 0.1, cy: 0.45, r: 0.55 },
        { color: '#FFD3A8', cx: 0.8, cy: 0.92, r: 0.6 },
      ],
    },
  },
  night: {
    colors: {
      statusBar: 'light',
      text: '#EEF2F8',
      textMuted: '#D3DCEA',
      surface: '#FFFFFF17',
      border: '#FFFFFF33',
      primary: '#A9BEE8',
      primaryEdge: '#7F96C6',
      onPrimary: '#101B30',
      track: '#FFFFFF26',
      accent: '#C4D3F0',
    },
    backdrop: {
      gradient: ['#0D1628', '#15223D', '#1D2E50'],
      blobs: [
        { color: '#2A4373', cx: 0.85, cy: 0.15, r: 0.6 },
        { color: '#1B2B4E', cx: 0.1, cy: 0.5, r: 0.55 },
        { color: '#30487A', cx: 0.6, cy: 0.95, r: 0.6 },
      ],
    },
  },
};
