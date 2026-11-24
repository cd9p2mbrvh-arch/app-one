import { createAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';

import { speakAs, stopSpeaking } from '@/audio/narratorVoice';
import { ensurePlaybackAudioMode } from '@/audio/useMusicPreview';
import type { Narrator } from '@/content/manifest';

import { SessionEngine, type EngineLine, type EngineState } from './engine';

type Options = {
  lines: EngineLine[];
  durationMs: number;
  narrator: Narrator;
  /** Position of the narrator in the catalogue (picks the placeholder system voice). */
  narratorIndex: number;
  musicSource: number;
  onFinish: (state: EngineState) => void;
};

/**
 * Starts a session when the screen mounts and stops it when it unmounts.
 * Wires the engine to real audio: a looping music player and on-device speech.
 */
export function useSession({
  lines,
  durationMs,
  narrator,
  narratorIndex,
  musicSource,
  onFinish,
}: Options) {
  const [state, setState] = useState<EngineState>({
    status: 'idle',
    elapsedMs: 0,
    durationMs,
    currentLine: null,
    linesSpoken: 0,
    completed: null,
  });
  const engine = useRef<SessionEngine | null>(null);
  const finish = useRef(onFinish);
  useEffect(() => {
    finish.current = onFinish;
  });

  useEffect(() => {
    ensurePlaybackAudioMode();
    const player = createAudioPlayer(musicSource);
    player.loop = true;
    let released = false;
    const e = new SessionEngine(
      lines,
      durationMs,
      {
        now: Date.now,
        random: Math.random,
        speak: (text, onDone) => {
          speakAs(narrator, narratorIndex, text, onDone).catch(onDone);
        },
        stopSpeech: stopSpeaking,
        music: {
          play: () => !released && player.play(),
          pause: () => !released && player.pause(),
          setVolume: (v) => {
            if (!released) player.volume = v;
          },
          release: () => {
            if (released) return;
            released = true;
            player.remove();
          },
        },
      },
      setState,
      (s) => finish.current(s),
    );
    engine.current = e;
    e.start();
    return () => e.dispose();
  }, [lines, durationMs, narrator, narratorIndex, musicSource]);

  return {
    state,
    pause: () => engine.current?.pause(),
    resume: () => engine.current?.resume(),
    end: () => engine.current?.end(),
  };
}
