import { render, screen } from '@testing-library/react-native';

import { clampProgress, ProgressBar } from '../ProgressBar';

describe('clampProgress', () => {
  it.each([
    [0.5, 0.5],
    [-1, 0],
    [2, 1],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
  ])('clamps %p to %p', (input, expected) => {
    expect(clampProgress(input)).toBe(expected);
  });
});

describe('ProgressBar', () => {
  it('reports its value as a percentage and sizes the fill', async () => {
    await render(<ProgressBar value={0.62} testID="xp" accessibilityLabel="Level progress" />);

    const bar = screen.getByRole('progressbar', { name: 'Level progress' });
    expect(bar).toHaveAccessibilityValue({ min: 0, max: 100, now: 62 });
    expect(screen.getByTestId('xp-fill')).toHaveStyle({ width: '62%' });
  });
});
