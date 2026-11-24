import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { ensurePlaybackAudioMode } from '@/audio/useMusicPreview';

/** Candidate sounds for moving between tabs (see scripts/generate_sfx.py). */
export const TAB_SOUNDS = {
  swish: require('../../assets/sfx/tab_swish.m4a'),
  pop: require('../../assets/sfx/tab_pop.m4a'),
  tick: require('../../assets/sfx/tab_tick.m4a'),
  chime: require('../../assets/sfx/tab_chime.m4a'),
} as const;

export type TabSound = keyof typeof TAB_SOUNDS;
export const TAB_SOUND_NAMES = Object.keys(TAB_SOUNDS) as TabSound[];

const VOLUME = 0.4;

let current: TabSound = 'swish';
const players: Partial<Record<TabSound, AudioPlayer>> = {};

export function getTabSound(): TabSound {
  return current;
}

/** Temporary: lets the sound be compared in the app. */
export function setTabSound(sound: TabSound) {
  current = sound;
}

/** Short sound when moving between tabs. Reuses one player per sound. */
export function playTabSound(sound: TabSound = current) {
  try {
    ensurePlaybackAudioMode();
    const player = (players[sound] ??= createAudioPlayer(TAB_SOUNDS[sound]));
    player.volume = VOLUME;
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // Sound effects are optional; never let them break navigation.
  }
}

/** For tests. */
export function resetSounds() {
  for (const name of TAB_SOUND_NAMES) {
    players[name]?.remove();
    delete players[name];
  }
  current = 'swish';
}
