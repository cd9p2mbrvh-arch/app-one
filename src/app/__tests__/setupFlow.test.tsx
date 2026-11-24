import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { useProfiles } from '@/state/profiles';
import { useSessionSetup } from '@/state/sessionSetup';
import { themeWrapper } from '@/test/render';
import { appRoutes } from '@/test/routes';

const press = (name: string | RegExp, role: 'button' | 'tab' = 'button') =>
  fireEvent.press(screen.getByRole(role, { name }));

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

describe('Session setup flow', () => {
  it('goes from home to the setup tabs', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/home' });

    await press('Start session');

    expect(screen).toHavePathname('/setup');
    expect(screen.getByRole('tab', { name: 'Theme' })).toBeSelected();
  });

  it('advances through the tabs and unlocks Begin when everything is chosen', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/setup' });
    expect(screen.getByRole('button', { name: 'Begin' })).toBeDisabled();

    await press('Peace of Mind');
    expect(screen.getByRole('tab', { name: 'Voice' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Theme, done' })).toBeTruthy();

    await press('Voice 6');
    expect(screen.getByRole('tab', { name: 'Music' })).toBeSelected();

    await press('Music 2');
    expect(screen.getByRole('tab', { name: 'Time' })).toBeSelected();

    await press('20 min');
    expect(screen.getByRole('button', { name: 'Begin' })).toBeEnabled();

    await press('Begin');
    expect(screen).toHavePathname('/session');
    expect(screen.getByText('Theme: Peace of Mind')).toBeTruthy();
    expect(screen.getByText('Time: 20 min')).toBeTruthy();
  });

  it('lets the user jump between tabs and change an earlier choice', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/setup' });

    await press('Music', 'tab');
    expect(screen.getByText('Choose background music')).toBeTruthy();
    await press('Music 3');
    // Music was chosen out of order, so it moves on to the first unfinished step.
    expect(screen.getByRole('tab', { name: 'Time' })).toBeSelected();

    await press('Theme', 'tab');
    await press('Health');
    expect(screen.getByRole('tab', { name: 'Voice' })).toBeSelected();

    await press('Theme, done', 'tab');
    expect(screen.getByRole('button', { name: 'Health' })).toBeSelected();
    expect(useSessionSetup.getState().theme).toBe('health');
    expect(useSessionSetup.getState().music).toBe('music3');
  });
});

describe('Background preview on home', () => {
  it('switches the look when a period is chosen', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper('morning'), initialUrl: '/home' });

    await press('Night', 'tab');
    expect(screen.getByRole('tab', { name: 'Night' })).toBeSelected();
  });
});
