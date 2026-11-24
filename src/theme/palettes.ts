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

/** A soft wave band drifting sideways. `y` is a fraction of the screen height. */
export type Wave = { color: string; y: number; opacity: number };

export type Backdrop = {
  /** Top-to-bottom base gradient */
  gradient: [string, string, string];
  /** Soft colour spots layered over the gradient; they drift slowly */
  blobs: Blob[];
  /** Gentle waves rolling behind the frosted-glass layer */
  waves: Wave[];
  /** Frosted-glass tint over the moving background */
  glass: 'light' | 'dark';
};

export type Look = { colors: Palette; backdrop: Backdrop };

export const looks: Record<TimeOfDay, Look> = {
  morning: {
    // Sunrise sky: clear light blue above, warm white and a faint peach glow below.
    colors: {
      statusBar: 'dark',
      text: '#1D3144',
      textMuted: '#3A5266',
      surface: '#FFFFFFB8',
      border: '#B3D1EA',
      primary: '#2C6FA8',
      primaryEdge: '#205584',
      onPrimary: '#FFFFFF',
      track: '#FFFFFF99',
      accent: '#1F527D',
    },
    backdrop: {
      gradient: ['#C7E2F8', '#EAF4FC', '#FFF1E8'],
      blobs: [
        { color: '#A6CFF2', cx: 0.15, cy: 0.12, r: 0.55 },
        { color: '#F7D5E3', cx: 0.95, cy: 0.5, r: 0.45 },
        { color: '#FFD7C2', cx: 0.3, cy: 0.92, r: 0.6 },
      ],
      waves: [
        { color: '#FFFFFF', y: 0.6, opacity: 0.45 },
        { color: '#B9DAF6', y: 0.8, opacity: 0.35 },
      ],
      glass: 'light',
    },
  },
  noon: {
    // Bright midday: golden yellow above, deeper orange and coral below.
    colors: {
      statusBar: 'dark',
      text: '#33200F',
      textMuted: '#4A2E16',
      surface: '#FFFFFFAD',
      border: '#E79A55',
      primary: '#8C3E0E',
      primaryEdge: '#6A2E09',
      onPrimary: '#FFFFFF',
      track: '#FFFFFF8C',
      accent: '#4F2A0B',
    },
    backdrop: {
      gradient: ['#FFD45C', '#FFB463', '#FF915E'],
      blobs: [
        { color: '#FFE88E', cx: 0.85, cy: 0.1, r: 0.55 },
        { color: '#FF7E57', cx: 0.1, cy: 0.55, r: 0.5 },
        { color: '#FFC23F', cx: 0.8, cy: 0.92, r: 0.6 },
      ],
      waves: [
        { color: '#FFF0B8', y: 0.58, opacity: 0.4 },
        { color: '#FF8C5A', y: 0.8, opacity: 0.35 },
      ],
      glass: 'light',
    },
  },
  night: {
    colors: {
      statusBar: 'light',
      text: '#EEF2F8',
      textMuted: '#DEE5F1',
      surface: '#FFFFFF12',
      border: '#FFFFFF33',
      primary: '#C3D3F4',
      primaryEdge: '#8FA6D6',
      onPrimary: '#101B30',
      track: '#FFFFFF1A',
      accent: '#D2DEF5',
    },
    backdrop: {
      // Deep navy above, lighter blue below, with a hint of violet.
      gradient: ['#060B19', '#13213F', '#2A3F6E'],
      blobs: [
        { color: '#34558F', cx: 0.85, cy: 0.15, r: 0.55 },
        { color: '#0B1430', cx: 0.1, cy: 0.5, r: 0.55 },
        { color: '#3D4A86', cx: 0.6, cy: 0.95, r: 0.6 },
      ],
      waves: [
        { color: '#2E4C85', y: 0.62, opacity: 0.45 },
        { color: '#36518C', y: 0.82, opacity: 0.35 },
      ],
      glass: 'dark',
    },
  },
};
