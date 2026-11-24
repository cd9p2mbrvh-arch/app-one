import { screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

import { renderWithTheme as render } from '@/test/render';
import type { TimeOfDay } from '@/theme';

import { Background } from '../Background';
import { seededRandom } from '../motion';

describe('Background scenes', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each<TimeOfDay>(['morning', 'noon', 'night'])('renders the %s scene', async (period) => {
    await render(<Background />, period);
    expect(
      screen.getByTestId(`background-${period}`, { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it.each<TimeOfDay>(['morning', 'noon', 'night'])('animates the %s scene', async (period) => {
    const loop = jest.spyOn(Animated, 'loop');
    await render(<Background />, period);
    expect(loop).toHaveBeenCalled();
  });

  it('stays still when Reduce Motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { rerender } = await render(<Background />, 'night');
    const loop = jest.spyOn(Animated, 'loop');
    loop.mockClear();
    await rerender(<Background />);
    expect(loop).not.toHaveBeenCalled();
  });
});

describe('seededRandom', () => {
  it('repeats for the same seed and stays within [0, 1)', () => {
    const a = seededRandom(5);
    const b = seededRandom(5);
    const values = Array.from({ length: 50 }, () => a());
    expect(values).toEqual(Array.from({ length: 50 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
  });
});
