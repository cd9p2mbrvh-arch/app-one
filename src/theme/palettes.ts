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
  /** Glass material: see-through fill for cards, bars and fields */
  glassFill: string;
  /** Glass material: bright edge where light catches the glass */
  glassEdge: string;
  /** Glass material: colour of the soft shadow under glass (used with low alpha) */
  glassShadow: string;
};

export type Backdrop = {
  /** Top-to-bottom sky gradient */
  gradient: [string, string, string];
  /**
   * Every other colour the animated scene can show behind text (sun, sea, sand,
   * clouds…). Used by the contrast tests. Small bright details placed away from
   * text (the moon, stars) are deliberately not listed.
   */
  sceneColors: string[];
  /** Frosted-glass tint over the animated scene */
  glass: 'light' | 'dark';
};

export type Look = { colors: Palette; backdrop: Backdrop };

/** The looks as first designed, with the solid "chunky" card material. */
export const baseLooks: Record<TimeOfDay, Look> = {
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
      glassFill: '#FFFFFF80',
      glassEdge: '#FFFFFFCC',
      glassShadow: '#2C4A6B',
    },
    backdrop: {
      // Sunrise: clear sky above, warm light near the horizon, the sun rising.
      gradient: ['#BFE0F7', '#E6F2FC', '#FFE6D3'],
      sceneColors: ['#FFF6DA', '#FFD9A0', '#FFFFFF', '#F7D5E3'],
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
      primary: '#9A2F2B',
      primaryEdge: '#701F1C',
      onPrimary: '#FFFFFF',
      track: '#FFFFFF8C',
      accent: '#6E1E22',
      glassFill: '#FFFFFF7A',
      glassEdge: '#FFFFFFC7',
      glassShadow: '#7A3410',
    },
    backdrop: {
      // Sunset at the beach: golden sky, sun sinking into a warm sea, sand below.
      gradient: ['#FFC861', '#FFA15C', '#FA8A6C'],
      sceneColors: ['#FFE7A0', '#F7A184', '#E58C98', '#F6CFA6', '#FFFFFF'],
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
      glassFill: '#FFFFFF14',
      glassEdge: '#FFFFFF38',
      glassShadow: '#000000',
    },
    backdrop: {
      // Moon and stars: deep navy above, lighter blue below, drifting clouds.
      gradient: ['#060B19', '#13213F', '#2A3F6E'],
      // Night clouds, and the moon's cloud wisps blended over the sky (worst case).
      sceneColors: ['#22355E', '#2E4C85', '#435988'],
      glass: 'dark',
    },
  },
};

/**
 * Material of cards, bars and fields across the app. 'glass' = see-through soft
 * frosted glass with bright edges and soft shadows (current). 'chunky' = the
 * earlier frosted cards with a solid 3D bottom edge. Change this one line to
 * switch back.
 */
export const UI_MATERIAL: 'glass' | 'chunky' = 'glass';

function withMaterial(look: Look): Look {
  if (UI_MATERIAL !== 'glass') return look;
  const c = look.colors;
  return { ...look, colors: { ...c, surface: c.glassFill, border: c.glassEdge } };
}

/** The looks in use (with the material above applied). */
export const looks: Record<TimeOfDay, Look> = {
  morning: withMaterial(baseLooks.morning),
  noon: withMaterial(baseLooks.noon),
  night: withMaterial(baseLooks.night),
};
