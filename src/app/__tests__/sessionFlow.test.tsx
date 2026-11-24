import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { AppState } from 'react-native';

import { useProfiles } from '@/state/profiles';
import { progressOf, useProgress } from '@/state/progress';
import { useSessionSetup } from '@/state/sessionSetup';
import { themeWrapper } from '@/test/render';
import { appRoutes } from '@/test/routes';

const MIN = 60000;

/**
 * The session's players: the music player, and the narration sprite players
 * (created with a fast position-update interval).
 */
const sessionPlayers = () => {
  const mock = createAudioPlayer as jest.Mock;
  const isVoice = (args: unknown[]) =>
    !!(args[1] as { updateInterval?: number } | undefined)?.updateInterval;
  const musicIndex = mock.mock.calls.findLastIndex((args) => !isVoice(args));
  const voices = mock.mock.calls
    .map((args, i) => (isVoice(args) ? mock.mock.results[i].value : null))
    .filter(Boolean);
  return { music: mock.mock.results[musicIndex]?.value, voices };
};

/** Total clips started across the narration players. */
const clipsStarted = () =>
  sessionPlayers().voices.reduce(
    (n: number, p: { seekTo: jest.Mock }) => n + p.seekTo.mock.calls.length,
    0,
  );

const press = (name: string | RegExp, index = 0) =>
  fireEvent.press(screen.getAllByRole('button', { name })[index]);
const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

async function startSession(minutes: number) {
  await act(() => useSessionSetup.getState().choose('duration', minutes));
  await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/home' });
  await screen.findByRole('tab', { name: 'Theme' });
  await act(() => useSessionSetup.getState().choose('duration', minutes));
  await fireEvent.press(screen.getByRole('tab', { name: 'Time' }));
  await press('Begin');
  await wait(800);
  expect(screen).toHavePathname('/session');
}

beforeEach(async () => {
  jest.clearAllMocks();
  await act(() =>
    useProfiles.setState({
      profiles: [{ id: 'p1', name: 'Anna', avatar: 'moon', createdAt: '2026-01-01T00:00:00Z' }],
      activeId: 'p1',
    }),
  );
  await act(() => useProgress.setState({ byProfile: {} }));
});

afterEach(async () => {
  await act(() => useSessionSetup.getState().reset());
});

describe('A meditation session', () => {
  it('counts down, speaks affirmations and shows them as subtitles', async () => {
    await startSession(3);
    expect(screen.getByTestId('time-left')).toHaveTextContent('03:00');
    expect(screen.getByText('Abundance · Narrator 1')).toBeTruthy();

    await wait(5000);
    // The first line plays from its audio clip, and its words show as a subtitle.
    // (In tests every audio file is the same stub, so the shared and own sprites share
    // one player here; the two-sprite rule is covered by the narration tests.)
    expect(sessionPlayers().voices.length).toBeGreaterThanOrEqual(1);
    expect(clipsStarted()).toBe(1);
    expect(
      sessionPlayers().voices.some((p: { play: jest.Mock }) => p.play.mock.calls.length > 0),
    ).toBe(true);
    expect(screen.getByTestId('subtitle')).toBeTruthy();
    expect(screen.getByTestId('time-left')).toHaveTextContent('02:55');
    // The device's speech engine is no longer used during sessions.
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('sets up background playback and the lock screen before the music starts', async () => {
    await startSession(3);
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    const { music, voices } = sessionPlayers();
    expect(music.loop).toBe(true);
    expect(music.setActiveForLockScreen).toHaveBeenCalledWith(true, {
      title: 'Abundance',
      artist: 'Narrator 1',
      albumTitle: 'App One',
    });
    expect(music.play).toHaveBeenCalled();
    // Narration: its own players, pitch following speed for the placeholder voices.
    for (const v of voices) {
      expect(v.shouldCorrectPitch).toBe(false);
      expect(v.setPlaybackRate).toHaveBeenCalledWith(1);
    }
  });

  describe('temporary audio check (background playback)', () => {
    it('reports when background playback was set up', async () => {
      await startSession(3);
      expect(screen.getByTestId('audio-check')).toHaveTextContent(
        'Audio check: background playback on',
      );
    });

    it('reports when iOS refused the background setup, with the reason', async () => {
      (setAudioModeAsync as jest.Mock)
        .mockRejectedValueOnce(new Error('Session busy'))
        .mockRejectedValueOnce(new Error('Session busy'));
      await startSession(3);
      await wait(500);
      expect(screen.getByTestId('audio-check')).toHaveTextContent(
        'Audio check: background setup FAILED (Session busy)',
      );
    });

    it('retries once if the first setup attempt fails', async () => {
      (setAudioModeAsync as jest.Mock).mockRejectedValueOnce(new Error('Session busy'));
      await startSession(3);
      await wait(500);
      expect(screen.getByTestId('audio-check')).toHaveTextContent(
        'Audio check: background playback on',
      );
    });

    it('tells whether the music kept playing while the phone was locked', async () => {
      // Capture AppState listeners while keeping the original behaviour.
      const listeners: ((state: string) => void)[] = [];
      const original = AppState.addEventListener;
      AppState.addEventListener = ((type: string, listener: (state: string) => void) => {
        listeners.push(listener);
        return original.call(AppState, type as 'change', listener as never);
      }) as typeof AppState.addEventListener;
      await startSession(3);
      const { music } = sessionPlayers();

      await act(() => listeners.forEach((l) => l('background')));
      music.playing = false; // the system paused it
      await wait(30000);
      await act(() => listeners.forEach((l) => l('active')));

      expect(screen.getByTestId('audio-check')).toHaveTextContent(
        'Audio check: away 30 s · music was playing when locked · was paused by the system',
      );
      expect(music.play).toHaveBeenCalledTimes(2); // re-sync restarted it
      AppState.addEventListener = original;
    });
  });

  it('plays the next clip 10–20 s after the previous one finishes', async () => {
    await startSession(10);
    await wait(5000);
    expect(clipsStarted()).toBe(1);
    // Report "past the end of the clip" from the player that is playing it.
    const playing = sessionPlayers().voices.find(
      (p: { seekTo: jest.Mock }) => p.seekTo.mock.calls.length > 0,
    );
    const onStatus = playing.addListener.mock.calls[0][1];
    await act(() => onStatus({ currentTime: 9999, didJustFinish: false }));
    expect(playing.pause).toHaveBeenCalled();

    await wait(9900);
    expect(clipsStarted()).toBe(1);
    await wait(10200);
    expect(clipsStarted()).toBe(2);
  });

  it('pauses and resumes the clock', async () => {
    await startSession(3);
    await wait(10000);
    await press('Pause');
    expect(screen.getByTestId('breath-label')).toHaveTextContent('Paused');
    const left = screen.getByTestId('time-left').props.children;
    await wait(60000);
    expect(screen.getByTestId('time-left')).toHaveTextContent(left);
    await press('Resume');
    await wait(1000);
    expect(screen.getByTestId('time-left')).not.toHaveTextContent(left);
  });

  it('completes, awards XP and shows the result', async () => {
    await startSession(3);
    await wait(3 * MIN + 1000);

    expect(screen).toHavePathname('/complete');
    expect(screen.getByText('Well done, Anna')).toBeTruthy();
    // 3 min × 10 + 25 completion + 15 first session today
    expect(screen.getByTestId('xp-total')).toHaveTextContent('+70 XP');
    expect(progressOf(useProgress.getState().byProfile, 'p1').totalXp).toBe(70);
  });

  it('celebrates a level-up and lists what it unlocked', async () => {
    await startSession(10);
    await wait(10 * MIN + 1000);
    await wait(3000); // level bar animation

    expect(screen.getByTestId('xp-total')).toHaveTextContent('+140 XP');
    expect(screen.getByText('Level up! You are now level 2')).toBeTruthy();
    expect(screen.getByText('New: Narrator 4, Music 3')).toBeTruthy();

    await press('Done');
    await wait(500);
    expect(screen).toHavePathname('/home');
    expect(screen.getByText('Level 2')).toBeTruthy();
  });

  it('can be ended early, after confirming, for reduced XP', async () => {
    await startSession(20);
    await wait(2.5 * MIN);

    await press('End session');
    // 2 full minutes × 5 + 15 first session today
    expect(screen.getByText(/You'll get 25 XP/)).toBeTruthy();
    await press('End now');
    await wait(500);

    expect(screen).toHavePathname('/complete');
    expect(screen.getByText('Session ended')).toBeTruthy();
    expect(screen.getByTestId('xp-total')).toHaveTextContent('+25 XP');
  });

  it('keeps going if ending is cancelled', async () => {
    await startSession(20);
    await wait(MIN);
    await press('End session');
    await press('Keep going');
    await wait(1000);
    expect(screen).toHavePathname('/session');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('explains that very short sessions earn nothing', async () => {
    await startSession(20);
    await wait(20000);
    await press('End session');
    expect(screen.getByText('Sessions shorter than a minute do not earn XP.')).toBeTruthy();
  });
});

describe('Progress and history', () => {
  it('shows an empty history at first', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/home' });
    await screen.findByRole('tab', { name: 'Theme' });
    await press(/Your progress and history/);
    expect(screen).toHavePathname('/history');
    expect(screen.getByText('No meditations yet. Your sessions will appear here.')).toBeTruthy();
  });

  it('lists finished sessions with date, length and XP, newest first', async () => {
    jest.setSystemTime(new Date(2026, 10, 24, 9, 0));
    await startSession(3);
    await wait(3 * MIN + 1000);
    expect(screen.getByLabelText(/Today: Morning done, Noon not yet, Night not yet/)).toBeTruthy();
    await press('Done');
    await wait(500);

    await press(/Your progress and history/);
    expect(screen).toHavePathname('/history');
    expect(screen.getByLabelText('Tue 24 Nov · 09:03. Abundance, 3 min. 70 XP.')).toBeTruthy();
    expect(screen.getByText('70')).toBeTruthy(); // total XP tile
    expect(screen.getByLabelText(/Today: Morning done/)).toBeTruthy();
  });

  it('still opens the profile picker from the switch button', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/home' });
    await screen.findByRole('tab', { name: 'Theme' });
    await press('Switch profile, currently Anna');
    expect(screen).toHavePathname('/profiles');
  });
});
