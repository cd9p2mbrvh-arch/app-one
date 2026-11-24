import { NARRATION, type ThemeNarration } from './narration.generated';

/**
 * Which audio clip plays a line, for a narrator:
 * 1. the narrator's own recording of it (their own lines, and later their
 *    recordings of the shared lines), else
 * 2. the placeholder clip of the shared line.
 *
 * `lineId` is as returned by linesFor(): "s001" for shared lines,
 * "<voiceId>-v001" for a narrator's own lines.
 */
export function narrationSource(
  themeId: string,
  voiceId: string,
  lineId: string,
  narration: Record<string, ThemeNarration> = NARRATION,
): number | undefined {
  const theme = narration[themeId];
  if (!theme) return undefined;
  const prefix = `${voiceId}-`;
  const id = lineId.startsWith(prefix) ? lineId.slice(prefix.length) : lineId;
  return theme.voices[voiceId]?.[id] ?? theme.shared[id];
}
