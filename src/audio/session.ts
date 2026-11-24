import { setAudioModeAsync } from 'expo-audio';

/**
 * Audio session settings for everything the app plays (sessions, previews,
 * narration). Following the expo-audio guide for background playback:
 * - plays with the iPhone's silent switch on;
 * - keeps playing when the screen locks or the app goes to the background
 *   (the app config enables the iOS "audio" background mode);
 * - takes audio focus (`doNotMix`), which iOS and Android need to show the
 *   session on the lock screen and to keep it alive in the background.
 */
const MODE = {
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'doNotMix',
} as const;

export function configureAudioSession(): Promise<void> {
  return setAudioModeAsync(MODE);
}

/**
 * Like configureAudioSession, but retries once and reports the outcome instead
 * of throwing, so a session can still start (and the problem can be shown).
 */
export async function configureAudioSessionReporting(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await setAudioModeAsync(MODE);
    return { ok: true };
  } catch (first) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await setAudioModeAsync(MODE);
      return { ok: true };
    } catch (second) {
      const message =
        (second ?? first) instanceof Error ? (second as Error).message : String(second ?? first);
      return { ok: false, error: message };
    }
  }
}
