import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { PRIVACY_POLICY } from '@/content/legal/privacyPolicy';
import { useProfiles } from '@/state/profiles';
import { usePurchases } from '@/state/purchases';
import { useSessionSetup } from '@/state/sessionSetup';
import { themeWrapper } from '@/test/render';
import { appRoutes } from '@/test/routes';

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole('button', { name }));

async function openSettings() {
  await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/home' });
  await screen.findByRole('tab', { name: 'Theme' });
  await press('About App One');
  expect(screen).toHavePathname('/about');
}

beforeEach(async () => {
  await act(() =>
    useProfiles.setState({
      profiles: [{ id: 'p1', name: 'Anna', avatar: 'moon', createdAt: '2026-01-01T00:00:00Z' }],
      activeId: 'p1',
    }),
  );
  await act(() => usePurchases.setState({ owned: [] }));
});

afterEach(async () => {
  await act(() => useSessionSetup.getState().reset());
});

describe('About', () => {
  it('is reached from the profile page and shows the health notice and version', async () => {
    await openSettings();
    expect(screen.getByTestId('health-notice')).toHaveTextContent(/not medical advice/);
    expect(screen.getByLabelText('Version: 1.0.0')).toBeTruthy();
  });

  it('restores purchases and says what happened', async () => {
    await openSettings();
    await press('Restore purchases');
    expect(await screen.findByTestId('restore-message')).toHaveTextContent(
      'No purchases to restore.',
    );

    await act(() => usePurchases.setState({ owned: ['narrator.voice7'] }));
    await press('Restore purchases');
    expect(await screen.findByText('Restored 1 purchase.')).toBeTruthy();
  });

  it('opens the privacy policy with all its sections', async () => {
    await openSettings();
    await press('Privacy policy');
    expect(screen).toHavePathname('/privacy');
    for (const section of PRIVACY_POLICY) {
      expect(screen.getByRole('header', { name: section.heading })).toBeTruthy();
    }
  });

  it('hides "Contact support" until a support e-mail is set', async () => {
    await openSettings();
    expect(screen.queryByRole('button', { name: 'Contact support' })).toBeNull();
  });
});

describe('Health theme note', () => {
  it('appears only while the Health theme is selected', async () => {
    await renderRouter(appRoutes, { wrapper: themeWrapper(), initialUrl: '/home' });
    await screen.findByRole('tab', { name: 'Theme' });
    expect(screen.queryByTestId('health-theme-note')).toBeNull();

    await press('Health');
    expect(screen.getByTestId('health-theme-note')).toHaveTextContent(/not medical advice/);

    await press('Peace of Mind');
    expect(screen.queryByTestId('health-theme-note')).toBeNull();
  });
});
