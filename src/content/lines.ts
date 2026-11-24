import abundance from './lines/en/abundance.json';
import gratitude from './lines/en/gratitude.json';
import health from './lines/en/health.json';
import peace from './lines/en/peace.json';

export type Line = { id: string; text: string };

export type ThemeLines = {
  placeholder?: boolean;
  theme: string;
  language: string;
  /** Read by every voice. */
  shared: Line[];
  /** Extra lines recorded only by that voice, keyed by voice id. */
  voices: Record<string, Line[]>;
};

/** English lines bundled with the app. Other languages will be downloadable packs. */
export const LINES_EN: Record<string, ThemeLines> = { abundance, peace, health, gratitude };

/** All lines a given voice reads for a theme: shared ones plus its own. */
export function linesFor(themeId: string, voiceId: string, lines = LINES_EN): Line[] {
  const theme = lines[themeId];
  if (!theme) return [];
  const own = theme.voices[voiceId] ?? [];
  return [...theme.shared, ...own.map((l) => ({ ...l, id: `${voiceId}-${l.id}` }))];
}
