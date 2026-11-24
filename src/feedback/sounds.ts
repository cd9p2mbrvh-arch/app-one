import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { ensurePlaybackAudioMode } from '@/audio/useMusicPreview';

const WHOOSH = require('../../assets/sfx/whoosh.m4a');
const WHOOSH_VOLUME = 0.35;

let whooshPlayer: AudioPlayer | null = null;

/** Short airy sound when moving between tabs. Reuses one player. */
export function playWhoosh() {
  try {
    ensurePlaybackAudioMode();
    whooshPlayer ??= createAudioPlayer(WHOOSH);
    whooshPlayer.volume = WHOOSH_VOLUME;
    whooshPlayer.seekTo(0).catch(() => {});
    whooshPlayer.play();
  } catch {
    // Sound effects are optional; never let them break navigation.
  }
}

/** For tests. */
export function resetSounds() {
  whooshPlayer?.remove();
  whooshPlayer = null;
}
