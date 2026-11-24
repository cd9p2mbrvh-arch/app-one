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

/** Turns a wheel one step. renderRouter uses fake timers, so finish the settle animation. */
async function turn(name: string, direction: 'increment' | 'decrement', expected: string) {
  await fireEvent(wheel(name), 'accessibilityAction', { nativeEvent: { actionName: direction } });
  await act(() => jest.advanceTimersByTime(500));
  expect(wheel(name)).toHaveAccessibilityValue({ text: expected });
}

async function open() {
  await renderRouter(appRoutes, { wrapper: themeWrapper() });
  await screen.findByRole('tab', { name: 'Theme' });
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
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    const player = (createAudioPlayer as jest.Mock).mock.results[0].value;
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
    const player = (createAudioPlayer as jest.Mock).mock.results[0].value;

    await act(() => jest.advanceTimersByTime(8000));
    expect(player.remove).toHaveBeenCalled();
  });

  it('lets locked music be previewed but not chosen', async () => {
    await open();
    await press('Music', 'tab');

    await press(/^Music 4, .*locked, level 4/);
    expect(createAudioPlayer).toHaveBeenCalled();
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

    await turn('Time', 'increment', '11 minutes');
    await press('Begin');

    expect(screen).toHavePathname('/session');
    expect(screen.getByText('Theme: Gratitude')).toBeTruthy();
    expect(screen.getByText('Narrator: Narrator 3')).toBeTruthy();
    expect(screen.getByText('Time: 11 min')).toBeTruthy();
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
