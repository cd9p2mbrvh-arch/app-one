import type { SpriteClip } from '@/audio/spritePlayer';

import { NARRATION, NARRATION_SPRITES, type ThemeNarration } from './narration.generated';

/**
 * Which clip plays a line, for a narrator:
 * 1. the narrator's own recording of it (their own lines, and later their
 *    recordings of the shared lines), else
 * 2. the placeholder clip of the shared line.
 *
 * `lineId` is as returned by linesFor(): "s001" for shared lines,
 * "<voiceId>-v001" for a narrator's own lines.
 */
export function narrationClip(
  themeId: string,
  voiceId: string,
  lineId: string,
  narration: Record<string, ThemeNarration> = NARRATION,
  sprites: Record<string, number> = NARRATION_SPRITES,
): SpriteClip | undefined {
  const theme = narration[themeId];
  if (!theme) return undefined;
  const prefix = `${voiceId}-`;
  const id = lineId.startsWith(prefix) ? lineId.slice(prefix.length) : lineId;
  const clip = theme.voices[voiceId]?.[id] ?? theme.shared[id];
  const source = clip ? sprites[clip.sprite] : undefined;
  return clip && source !== undefined ? { source, start: clip.start, end: clip.end } : undefined;
}

/** The sprite files a session with this theme and narrator will use. */
export function narrationSprites(
  themeId: string,
  voiceId: string,
  narration: Record<string, ThemeNarration> = NARRATION,
  sprites: Record<string, number> = NARRATION_SPRITES,
): number[] {
  const theme = narration[themeId];
  if (!theme) return [];
  const keys = new Set<string>();
  for (const clip of Object.values(theme.shared)) keys.add(clip.sprite);
  for (const clip of Object.values(theme.voices[voiceId] ?? {})) keys.add(clip.sprite);
  return [...keys].map((k) => sprites[k]).filter((s): s is number => s !== undefined);
}
