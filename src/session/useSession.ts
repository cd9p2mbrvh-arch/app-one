import { createAudioPlayer } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { speakAs, stopSpeaking } from '@/audio/narratorVoice';
import { configureAudioSession, configureAudioSessionReporting } from '@/audio/session';
import type { Narrator } from '@/content/manifest';

import { SessionEngine, type EngineLine, type EngineState } from './engine';

type Options = {
  lines: EngineLine[];
  /** Shown on the lock screen while the session plays. */
  nowPlaying: { title: string; artist: string };
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
  nowPlaying,
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
  // TEMPORARY diagnostics for background playback (shown on the session screen).
  const [audioCheck, setAudioCheck] = useState('Audio check: starting…');
  const finish = useRef(onFinish);
  useEffect(() => {
    finish.current = onFinish;
  });

  const { title, artist } = nowPlaying;

  useEffect(() => {
    let cancelled = false;
    let e: SessionEngine | null = null;

    let player: ReturnType<typeof createAudioPlayer> | null = null;
    let backgroundedAt: { wallMs: number; musicSec: number; playing: boolean } | null = null;

    // Wait for the audio session (background playback) before starting audio.
    configureAudioSessionReporting().then(async (setup) => {
      if (cancelled) return;
      setAudioCheck(
        setup.ok
          ? 'Audio check: background playback on'
          : `Audio check: background setup FAILED (${setup.error})`,
      );
      // Apply once more right before playing, in case anything changed it meanwhile.
      await configureAudioSession().catch(() => {});
      if (cancelled) return;
      const p = createAudioPlayer(musicSource);
      player = p;
      p.loop = true;
      try {
        // Lock-screen "Now playing": keeps the session alive with the screen locked.
        p.setActiveForLockScreen(true, { title, artist, albumTitle: 'App One' });
      } catch {
        // Not available on every platform; playback works without it.
      }
      let released = false;
      e = new SessionEngine(
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
            play: () => !released && p.play(),
            pause: () => !released && p.pause(),
            setVolume: (v) => {
              if (!released) p.volume = v;
            },
            release: () => {
              if (released) return;
              released = true;
              try {
                p.clearLockScreenControls();
              } catch {
                // ignore
              }
              p.remove();
            },
          },
        },
        setState,
        (s) => finish.current(s),
      );
      engine.current = e;
      e.start();
    });

    // Back from the lock screen or another app: re-sync music and clock.
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' && player) {
        backgroundedAt = {
          wallMs: Date.now(),
          musicSec: player.currentTime,
          playing: player.playing,
        };
      }
      if (next === 'active') {
        if (backgroundedAt && player) {
          // Did the music keep playing while the app was in the background?
          const awaySec = (Date.now() - backgroundedAt.wallMs) / 1000;
          const advanced = player.currentTime !== backgroundedAt.musicSec || player.playing;
          setAudioCheck(
            `Audio check: away ${Math.round(awaySec)} s · music was ${backgroundedAt.playing ? 'playing' : 'NOT playing'} when locked · ${advanced ? 'kept playing' : 'was paused by the system'}`,
          );
          backgroundedAt = null;
        }
        e?.resync();
      }
    });

    return () => {
      cancelled = true;
      sub.remove();
      e?.dispose();
    };
  }, [lines, durationMs, narrator, narratorIndex, musicSource, title, artist]);

  return {
    state,
    audioCheck,
    pause: () => engine.current?.pause(),
    resume: () => engine.current?.resume(),
    end: () => engine.current?.end(),
  };
}
