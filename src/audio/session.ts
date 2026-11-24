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
export function configureAudioSession(): Promise<void> {
  return setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  });
}
