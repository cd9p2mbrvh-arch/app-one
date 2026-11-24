import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { configureAudioSession } from './session';

/** Length of a music preview, and the fade-out at its end. */
export const PREVIEW_SECONDS = 3;
export const PREVIEW_FADE_MS = 500;
const PREVIEW_VOLUME = 0.8;
const FADE_STEPS = 10;

/** Applies the app's audio session settings (silent switch, background). */
export function ensurePlaybackAudioMode() {
  configureAudioSession().catch(() => {});
}

/**
 * Plays short previews of music tracks, one at a time. Starting a preview stops
 * the previous one; previews fade out and stop by themselves after
 * PREVIEW_SECONDS, and stop when the component using this hook unmounts.
 */
export function useMusicPreview() {
  const player = useRef<AudioPlayer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fade = useRef<ReturnType<typeof setInterval> | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (fade.current) clearInterval(fade.current);
    timer.current = null;
    fade.current = null;
    player.current?.pause();
    player.current?.remove();
    player.current = null;
    setPlayingId(null);
  }, []);

  const play = useCallback(
    (id: string, source: number) => {
      stop();
      ensurePlaybackAudioMode();
      const p = createAudioPlayer(source);
      p.volume = PREVIEW_VOLUME;
      p.play();
      player.current = p;
      setPlayingId(id);
      // Fade out over the last PREVIEW_FADE_MS, then stop.
      timer.current = setTimeout(
        () => {
          let step = 0;
          fade.current = setInterval(() => {
            step += 1;
            p.volume = PREVIEW_VOLUME * Math.max(0, 1 - step / FADE_STEPS);
            if (step >= FADE_STEPS) stop();
          }, PREVIEW_FADE_MS / FADE_STEPS);
        },
        PREVIEW_SECONDS * 1000 - PREVIEW_FADE_MS,
      );
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { playingId, play, stop };
}
