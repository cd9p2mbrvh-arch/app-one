import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';

import { useProfiles } from '@/state/profiles';
import { progressOf, useProgress } from '@/state/progress';
import { useSessionSetup } from '@/state/sessionSetup';
import { themeWrapper } from '@/test/render';
import { appRoutes } from '@/test/routes';

const MIN = 60000;

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
    expect(Speech.speak).toHaveBeenCalledTimes(1);
    const spoken = (Speech.speak as jest.Mock).mock.calls[0][0];
    expect(screen.getByTestId('subtitle')).toHaveTextContent(spoken);
    expect(screen.getByTestId('time-left')).toHaveTextContent('02:55');
  });

  it('sets up background playback and the lock screen before the music starts', async () => {
    await startSession(3);
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    const music = (createAudioPlayer as jest.Mock).mock.results.at(-1)?.value;
    expect(music.loop).toBe(true);
    expect(music.setActiveForLockScreen).toHaveBeenCalledWith(true, {
      title: 'Abundance',
      artist: 'Narrator 1',
      albumTitle: 'App One',
    });
    expect(music.play).toHaveBeenCalled();
    expect(Speech.speak).not.toHaveBeenCalled();
    await wait(5000);
    expect((Speech.speak as jest.Mock).mock.calls[0][1]).toMatchObject({
      useApplicationAudioSession: true,
    });
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
