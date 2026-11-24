import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ThemeProvider, useTheme } from '../ThemeProvider';

function Probe() {
  const { period, colors } = useTheme();
  return <Text testID="probe">{`${period} ${colors.text}`}</Text>;
}

describe('ThemeProvider', () => {
  afterEach(() => jest.useRealTimers());

  it('follows the clock', async () => {
    await render(
      <ThemeProvider now={() => new Date(2026, 0, 1, 13, 0)}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(/^noon /);
  });

  it('switches period when the clock crosses a boundary', async () => {
    jest.useFakeTimers();
    let current = new Date(2026, 0, 1, 17, 59, 30);
    const now = () => current;

    await render(
      <ThemeProvider now={now}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(/^noon /);

    current = new Date(2026, 0, 1, 18, 0, 30);
    await act(() => jest.advanceTimersByTime(60_000));
    expect(screen.getByTestId('probe')).toHaveTextContent(/^night /);
  });

  it('lets an override win over the clock', async () => {
    await render(
      <ThemeProvider now={() => new Date(2026, 0, 1, 9, 0)} initialOverride="night">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('night #EEF2F8');
  });

  it('fails loudly when used without a provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow('inside <ThemeProvider>');
  });
});
