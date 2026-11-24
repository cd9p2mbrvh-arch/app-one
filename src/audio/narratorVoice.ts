import * as Speech from 'expo-speech';

import type { Narrator } from '@/content/manifest';

import { ensurePlaybackAudioMode } from './useMusicPreview';

type SystemVoice = Pick<Speech.Voice, 'identifier' | 'language' | 'quality' | 'name'>;

/**
 * Picks which installed English system voices the placeholder narrators use:
 * enhanced-quality voices first, then by name, so the choice is stable.
 */
export function rankEnglishVoices(voices: SystemVoice[]): string[] {
  return voices
    .filter((v) => v.language?.toLowerCase().startsWith('en'))
    .sort((a, b) => {
      const qa = a.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
      const qb = b.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
      return qa - qb || a.name.localeCompare(b.name);
    })
    .map((v) => v.identifier);
}

/** The system voice for narrator number `index` (0-based); undefined = device default. */
export function systemVoiceFor(index: number, ranked: string[]): string | undefined {
  return ranked.length ? ranked[index % ranked.length] : undefined;
}

let rankedVoices: Promise<string[]> | null = null;

function loadVoices(): Promise<string[]> {
  rankedVoices ??= Speech.getAvailableVoicesAsync()
    .then(rankEnglishVoices)
    .catch(() => []);
  return rankedVoices;
}

/** Speaks text in a narrator's placeholder voice, interrupting anything already speaking. */
export async function speakAs(
  narrator: Narrator,
  index: number,
  text: string,
  onDone?: () => void,
) {
  ensurePlaybackAudioMode();
  const voice = systemVoiceFor(index, await loadVoices());
  await Speech.stop();
  Speech.speak(text, {
    language: 'en',
    voice,
    pitch: narrator.speech.pitch,
    rate: narrator.speech.rate,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function stopSpeaking() {
  Speech.stop().catch(() => {});
}

/** For tests: forget the cached voice list. */
export function resetVoiceCache() {
  rankedVoices = null;
}
