import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

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

const open = () => renderRouter(appRoutes, { wrapper: themeWrapper() });

beforeEach(async () => {
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
  it('opens straight on the Theme tab with the profile in the header', async () => {
    await open();

    expect(await screen.findByRole('tab', { name: 'Theme' })).toBeSelected();
    expect(screen).toHavePathname('/home');
    expect(screen.getByRole('button', { name: 'Switch profile, currently Anna' })).toBeTruthy();
    expect(screen.getByText('Level 1')).toBeTruthy();
    expect(wheel('Theme')).toHaveAccessibilityValue({ text: 'Abundance' });
  });

  it('chooses a theme by turning the wheel', async () => {
    await open();
    await screen.findByRole('tab', { name: 'Theme' });

    await turn('Theme', 'increment', 'Peace of Mind');
    expect(useSessionSetup.getState().theme).toBe('peace');
  });

  it('walks through all tabs with Next and begins a session', async () => {
    await open();
    await screen.findByRole('tab', { name: 'Theme' });

    await turn('Theme', 'decrement', 'Gratitude');
    await press('Next');
    expect(screen.getByRole('tab', { name: 'Voice' })).toBeSelected();

    await turn('Voice', 'increment', 'Voice 2');
    await press('Next');
    expect(screen.getByRole('tab', { name: 'Music' })).toBeSelected();

    await press('Next');
    expect(screen.getByRole('tab', { name: 'Time' })).toBeSelected();
    expect(wheel('Time')).toHaveAccessibilityValue({ text: '10 minutes' });

    await turn('Time', 'increment', '11 minutes');
    await press('Begin');

    expect(screen).toHavePathname('/session');
    expect(screen.getByText('Theme: Gratitude')).toBeTruthy();
    expect(screen.getByText('Voice: Voice 2')).toBeTruthy();
    expect(screen.getByText('Time: 11 min')).toBeTruthy();
  });

  it('shows locked voices but does not let them be used', async () => {
    await open();
    await screen.findByRole('tab', { name: 'Theme' });
    await press('Voice', 'tab');

    // Turning back from Voice 1 wraps round to Voice 6, which unlocks at level 5.
    await turn('Voice', 'decrement', 'Voice 6, locked. Unlocks at level 5');
    expect(screen.getByText('Unlocks at level 5')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();

    // On the Time tab, Begin explains why it is blocked.
    await press('Time', 'tab');
    expect(screen.getByRole('button', { name: 'Begin' })).toBeDisabled();
    expect(screen.getByText(/voice choice is locked/)).toBeTruthy();

    await press('Voice', 'tab');
    await turn('Voice', 'increment', 'Voice 1');
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('lets the user jump between tabs freely', async () => {
    await open();
    await screen.findByRole('tab', { name: 'Theme' });

    await press('Time', 'tab');
    expect(screen.getByText('How long?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Begin' })).toBeEnabled();

    await press('Theme', 'tab');
    expect(screen.getByText('Choose a theme')).toBeTruthy();
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
