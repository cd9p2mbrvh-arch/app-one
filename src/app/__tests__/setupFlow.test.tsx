import { createAudioPlayer } from 'expo-audio';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import * as Speech from 'expo-speech';

import { THEMES } from '@/content/manifest';
import { useProfiles } from '@/state/profiles';
import { usePurchases } from '@/state/purchases';
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
  await act(() => usePurchases.setState({ owned: [] }));
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

  it('plays a 3-second preview that fades out', async () => {
    await open();
    await press('Music', 'tab');
    await press(/^Music 1/);
    const player = lastPlayer();

    await act(() => jest.advanceTimersByTime(2400));
    expect(player.remove).not.toHaveBeenCalled();
    expect(player.volume).toBe(0.8);

    await act(() => jest.advanceTimersByTime(350)); // fading
    expect(player.volume).toBeLessThan(0.8);
    expect(player.volume).toBeGreaterThan(0);

    await act(() => jest.advanceTimersByTime(300)); // past 3 s
    expect(player.remove).toHaveBeenCalled();
    expect(screen.getByText('Tap to hear a preview')).toBeTruthy();
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

  it('previews a paid narrator and unlocks it through the demo purchase', async () => {
    await open();
    await press('Narrator', 'tab');

    await press('Narrator 7, $1 to unlock');
    await flush();
    expect(Speech.speak).toHaveBeenCalled();
    expect(screen.getByTestId('narrator-spotlight')).toHaveAccessibleName(
      'Narrator 7. Whisper soft. Available for $1.',
    );
    expect(useSessionSetup.getState().voice).toBe('voice1');

    // Opening the sheet and cancelling keeps it locked.
    await press('Unlock Narrator 7 for $1');
    expect(screen.getByText('DEMO · no payment is made')).toBeTruthy();
    await press('Not now');
    expect(usePurchases.getState().owned).toEqual([]);

    await press('Unlock Narrator 7 for $1');
    await press('Buy for $1');
    expect(usePurchases.getState().owned).toEqual(['narrator.voice7']);
    expect(useSessionSetup.getState().voice).toBe('voice7');
    expect(screen.getByRole('button', { name: 'Narrator 7' })).toBeSelected();
  });

  it('unlocks paid music through the demo purchase', async () => {
    await open();
    await press('Music', 'tab');

    await press(/^Music 5, Gentle rain.*\$1 to unlock/);
    expect(screen.getByText('Preview only · unlock to use this music')).toBeTruthy();
    await press('Unlock Music 5 for $1');
    await press('Buy for $1');

    expect(usePurchases.getState().owned).toEqual(['music.music5']);
    expect(useSessionSetup.getState().music).toBe('music5');
  });

  it('keeps purchases for every profile on the device', async () => {
    await act(() => usePurchases.setState({ owned: ['narrator.voice8'] }));
    await open();
    await press('Narrator', 'tab');
    await press('Narrator 8');
    expect(useSessionSetup.getState().voice).toBe('voice8');
  });

  describe('a theme with its own narrator and music', () => {
    // No real theme does this yet, so add a sample one for the test.
    beforeEach(() => {
      THEMES.push({
        id: 'sleep-story',
        label: 'Sleep Story',
        icon: 'moon-outline',
        unlockLevel: 1,
        fixed: { voice: 'voice8', music: 'music6' },
      });
    });
    afterEach(() => {
      THEMES.splice(
        THEMES.findIndex((t) => t.id === 'sleep-story'),
        1,
      );
    });

    it('fixes narrator and music while selected, and restores mine afterwards', async () => {
      await open();
      await press('Narrator', 'tab');
      await press('Narrator 2');
      await flush();
      await press('Theme', 'tab');

      await press('Sleep Story');
      await press('Narrator', 'tab');
      expect(screen.getByLabelText('Narrator 8 is set by the Sleep Story theme')).toBeTruthy();
      expect(screen.queryByTestId('narrator-spotlight')).toBeNull();
      await press('Music', 'tab');
      expect(screen.getByLabelText('Music 6 is set by the Sleep Story theme')).toBeTruthy();

      // Narrator 8 and Music 6 are normally paid, but they come with this theme.
      await press('Time', 'tab');
      expect(screen.getByRole('button', { name: 'Begin' })).toBeEnabled();
      await press('Begin');
      await act(() => jest.advanceTimersByTime(800));
      expect(screen.getByText('Narrator: Narrator 8')).toBeTruthy();
      expect(screen.getByText('Music: Music 6')).toBeTruthy();
      await press('Back');
      await act(() => jest.advanceTimersByTime(500));

      await press('Theme', 'tab');
      await press('Peace of Mind');
      await press('Narrator', 'tab');
      expect(screen.getByRole('button', { name: 'Narrator 2' })).toBeSelected();
    });
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
