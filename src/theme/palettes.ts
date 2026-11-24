/**
 * Colour palettes. The app uses `activePalette`; switching palette is a one-line change.
 * Every palette must pass the contrast checks in `__tests__/palettes.test.ts`.
 */
export type Palette = {
  /** Screen background */
  background: string;
  /** Cards, tiles and inputs */
  surface: string;
  /** Card borders and the 3D "edge" under cards */
  border: string;
  /** Main text */
  text: string;
  /** Secondary text (captions, hints) */
  textMuted: string;
  /** Main action colour (buttons, progress fill) */
  primary: string;
  /** 3D edge under primary buttons */
  primaryEdge: string;
  /** Text and icons placed on `primary` */
  onPrimary: string;
  /** Unfilled part of progress bars */
  track: string;
  /** Small highlights such as XP labels */
  accent: string;
};

export const palettes = {
  fog: {
    background: '#F5F6F6',
    surface: '#E9ECED',
    border: '#D5DADD',
    text: '#33393D',
    textMuted: '#5C666C',
    primary: '#66747C',
    primaryEdge: '#4F5C64',
    onPrimary: '#FFFFFF',
    track: '#E1E5E7',
    accent: '#5F6D76',
  },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;

export const activePaletteName: PaletteName = 'fog';
