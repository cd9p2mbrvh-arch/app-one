import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import HomeScreen from '../index';

describe('Home screen', () => {
  it('renders at the root route', async () => {
    await renderRouter({ index: HomeScreen });

    expect(screen).toHavePathname('/');
    expect(screen.getByText('App One')).toBeTruthy();
  });

  it('enables Start only after a theme is chosen', async () => {
    await renderRouter({ index: HomeScreen });

    const start = screen.getByRole('button', { name: 'Start session' });
    expect(start).toBeDisabled();

    await fireEvent.press(screen.getByRole('button', { name: 'Peace of Mind' }));

    expect(screen.getByRole('button', { name: 'Peace of Mind' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Start session' })).toBeEnabled();
  });
});
