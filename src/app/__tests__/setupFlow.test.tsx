import { createAudioPlayer } from 'expo-audio';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import * as Speech from 'expo-speech';

import { useProfiles } from '@/state/profiles';
import { useSessionSetup } from '@/state/sessionSetup';
import { themeWrapper } from '@/test/render';
import { appRoutes } from '@/test/routes';

const press = (name: string | RegExp, role: 'button' | 'tab' = 'button') =>
  fireEvent.press(screen.getByRole(role, { name }));

const wheel = (name: string) => screen.getByRole('adjustable', { name });

/** Steps the time dial the way VoiceOver does. */
async function step(direction: 'increment' | 'decrement', expected: string) {
  await fireEvent(wheel('Time'), 'accessibilityAction', { nativeEvent: { actionName: direction } });
  expect(wheel('Time')).toHaveAccessibilityValue({ text: expected });
}

/**
 * The most recently created audio player (in tests every sound file is the same
 * stub value, so players are told apart by creation order).
 */
const lastPlayer = () => (createAudioPlayer as jest.Mock).mock.results.at(-1)?.value;

type NavState = { routes: { name: string; state?: NavState }[] } | undefined;

/** Every route name in the (nested) navigation state. */
function routeNames(state: NavState): string[] {
  return (state?.routes ?? []).flatMap((r) => [r.name, ...routeNames(r.state)]);
}

async function open() {
  const app = await renderRouter(appRoutes, { wrapper: themeWrapper() });
  await screen.findByRole('tab', { name: 'Theme' });
  return app;
}

/** Lets the async speech call (voice list lookup) finish. */
const flush = () => act(() => jest.advanceTimersByTime(0));

beforeEach(async () => {
  jest.clearAllMocks();
  await act(() =>
    useProfiles.setState({
      profiles: [{ id: 'p1', name: 'Anna', avatar: 'moon', createdAt: '2026-01-01T00:00:00Z' }],
      activeId: 'p1',
    }),
  );
});

afterEach(async () => {
  await act(() => useSessionSetup.getState().reset());
});

describe('Main screen', () => {
  it('opens on the Theme tab with the profile in the header', async () => {
    await open();

    expect(screen.getByRole('tab', { name: 'Theme' })).toBeSelected();
    expect(screen).toHavePathname('/home');
    expect(screen.getByRole('button', { name: 'Switch profile, currently Anna' })).toBeTruthy();
    expect(screen.getByText('Level 1')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Narrator' })).toBeTruthy();
  });

  it('shows themes as squares and selects one', async () => {
    await open();
    expect(screen.getByRole('button', { name: 'Abundance' })).toBeSelected();

    await press('Peace of Mind');
    expect(screen.getByRole('button', { name: 'Peace of Mind' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Abundance' })).not.toBeSelected();
    expect(useSessionSetup.getState().theme).toBe('peace');
  });

  it('chooses a narrator, spotlights them and plays their sample', async () => {
    await open();
    await press('Narrator', 'tab');
    expect(screen.getByText('Choose your narrator')).toBeTruthy();

    await press('Narrator 2');
    await flush();

    expect(useSessionSetup.getState().voice).toBe('voice2');
    expect(screen.getByRole('button', { name: 'Narrator 2' })).toBeSelected();
    expect(screen.getByTestId('narrator-spotlight')).toHaveAccessibleName(
      'Narrator 2. Calm and deep.',
    );
    expect(Speech.speak).toHaveBeenCalledWith(
      expect.stringContaining('I am Narrator 2'),
      expect.objectContaining({ pitch: 0.85 }),
    );
  });

  it('lets locked narrators be previewed but not chosen', async () => {
    await open();
    await press('Narrator', 'tab');

    await press('Narrator 6, locked, level 5');
    await flush();

    expect(Speech.speak).toHaveBeenCalled();
    expect(screen.getByTestId('narrator-spotlight')).toHaveAccessibleName(
      'Narrator 6. Slow and serene. Locked. Unlocks at level 5.',
    );
    expect(useSessionSetup.getState().voice).toBe('voice1');
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('previews music from the list and stops it on a second tap', async () => {
    await open();
    await press('Music', 'tab');

    await press(/^Music 2, Ocean waves/);
    const player = lastPlayer();
    expect(player.play).toHaveBeenCalled();
    expect(useSessionSetup.getState().music).toBe('music2');
    expect(screen.getByText(/Playing a short preview/)).toBeTruthy();

    await press(/^Music 2, Ocean waves/);
    expect(player.remove).toHaveBeenCalled();
    expect(screen.getByText('Tap to hear a preview')).toBeTruthy();
  });

  it('stops a music preview by itself after a few seconds', async () => {
    await open();
    await press('Music', 'tab');
    await press(/^Music 1/);
    const player = lastPlayer();

    await act(() => jest.advanceTimersByTime(8000));
    expect(player.remove).toHaveBeenCalled();
  });

  it('lets locked music be previewed but not chosen', async () => {
    await open();
    await press('Music', 'tab');

    await press(/^Music 4, .*locked, level 4/);
    expect(lastPlayer()?.play).toHaveBeenCalled();
    expect(useSessionSetup.getState().music).toBe('music1');
    expect(screen.getByText('Preview only · reach level 4 to use this music')).toBeTruthy();
  });

  it('walks through all tabs with Next and begins a session', async () => {
    await open();

    await press('Gratitude');
    await press('Next');
    expect(screen.getByRole('tab', { name: 'Narrator' })).toBeSelected();

    await press('Narrator 3');
    await flush();
    await press('Next');
    expect(screen.getByRole('tab', { name: 'Music' })).toBeSelected();

    await press('Next');
    expect(screen.getByRole('tab', { name: 'Time' })).toBeSelected();
    expect(wheel('Time')).toHaveAccessibilityValue({ text: '10 minutes' });

    await step('increment', '15 minutes');
    await press('Begin');

    // The screen zooms and fades into the blur first, then the session opens.
    // (Native-driver animations complete immediately in tests, so only the end
    // result is checked here.)
    await act(() => jest.advanceTimersByTime(800));
    expect(screen).toHavePathname('/session');
    expect(screen.getByText('Theme: Gratitude')).toBeTruthy();
    expect(screen.getByText('Narrator: Narrator 3')).toBeTruthy();
    expect(screen.getByText('Time: 15 min')).toBeTruthy();
  });

  it('stops narrator speech when leaving the Narrator tab', async () => {
    await open();
    await press('Narrator', 'tab');
    await press('Narrator 1');
    await flush();
    (Speech.stop as jest.Mock).mockClear();

    await press('Music', 'tab');
    expect(Speech.stop).toHaveBeenCalled();
  });

  it('gives a haptic but no sound when changing tabs', async () => {
    await open();
    const Haptics = jest.requireMock('expo-haptics');
    Haptics.impactAsync.mockClear();

    await press('Music', 'tab');

    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(screen.getByRole('tab', { name: 'Music' })).toBeSelected();
  });

  it.each(['Narrator', 'Time', 'Music'])(
    'ends the slide fully visible after moving to %s',
    async (tab) => {
      await open();
      await press(tab, 'tab');
      await act(() => jest.advanceTimersByTime(600));
      expect(screen.getByTestId('tab-content')).toHaveStyle({ opacity: 1 });
      expect(screen.getByTestId('tab-content')).toHaveStyle({ transform: [{ translateX: 0 }] });
    },
  );

  it('does nothing when the current tab is tapped again', async () => {
    await open();
    const Haptics = jest.requireMock('expo-haptics');
    Haptics.impactAsync.mockClear();
    await press('Theme', 'tab');
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('starts the session only once when Begin is tapped twice', async () => {
    const app = await open();
    await press('Time', 'tab');
    await press('Begin');
    await press('Begin');
    await act(() => jest.advanceTimersByTime(800));
    expect(screen).toHavePathname('/session');
    expect(
      routeNames(app.getRouterState() as NavState).filter((n) => n === 'session'),
    ).toHaveLength(1);
  });

  it('shows the setup again, fully visible, after coming back from the session', async () => {
    await open();
    await press('Time', 'tab');
    await press('Begin');
    await act(() => jest.advanceTimersByTime(800));
    expect(screen).toHavePathname('/session');

    await press('Back');
    await act(() => jest.advanceTimersByTime(500));
    expect(screen).toHavePathname('/home');
    expect(screen.getByTestId('setup-screen')).toHaveStyle({ opacity: 1 });
    expect(screen.getByTestId('begin-blur')).toHaveStyle({ opacity: 0 });
    expect(screen.getByRole('button', { name: /^(Next|Begin)$/ })).toBeEnabled();
  });

  it('skips the Begin animation when Reduce Motion is on', async () => {
    const { AccessibilityInfo } = jest.requireActual('react-native');
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await open();
    await act(() => jest.advanceTimersByTime(0));
    await press('Time', 'tab');
    await press('Begin');
    expect(screen).toHavePathname('/session');
  });

  it('opens the profile picker from the header', async () => {
    await open();
    await press(/^Switch profile/);
    expect(screen).toHavePathname('/profiles');
  });

  it('cycles the temporary background preview', async () => {
    await open();
    // The test wrapper starts on "morning"; the button cycles auto → morning → noon → night.
    await press('Background preview: morning');
    expect(screen.getByRole('button', { name: 'Background preview: noon' })).toBeTruthy();
  });
});
