import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

export const PREVIEW_SECONDS = 8;

let audioModeSet = false;

/** Plays even when the iPhone's silent switch is on, as music apps do. */
export function ensurePlaybackAudioMode() {
  if (audioModeSet) return;
  audioModeSet = true;
  setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {
    audioModeSet = false;
  });
}

/**
 * Plays short previews of music tracks, one at a time. Starting a preview stops
 * the previous one; previews stop by themselves after PREVIEW_SECONDS and when
 * the component using this hook unmounts.
 */
export function useMusicPreview() {
  const player = useRef<AudioPlayer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
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
      p.volume = 0.8;
      p.play();
      player.current = p;
      setPlayingId(id);
      timer.current = setTimeout(stop, PREVIEW_SECONDS * 1000);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { playingId, play, stop };
}
