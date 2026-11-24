import { screen } from '@testing-library/react-native';
import { AccessibilityInfo, Animated } from 'react-native';

import { renderWithTheme as render } from '@/test/render';
import type { TimeOfDay } from '@/theme';

import { Background, wavePath } from '../Background';

describe('Background', () => {
  afterEach(() => jest.restoreAllMocks());

  it.each<TimeOfDay>(['morning', 'noon', 'night'])('renders the %s look', async (period) => {
    await render(<Background />, period);
    expect(
      screen.getByTestId(`background-${period}`, { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('animates by default', async () => {
    const loop = jest.spyOn(Animated, 'loop');
    await render(<Background />);
    expect(loop).toHaveBeenCalled();
  });

  it('stays still when Reduce Motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { rerender } = await render(<Background />);
    const loop = jest.spyOn(Animated, 'loop');
    loop.mockClear();
    // Re-render after the setting has been read.
    await rerender(<Background />);
    expect(loop).not.toHaveBeenCalled();
  });
});

describe('wavePath', () => {
  it('starts on the left edge and closes along the bottom', () => {
    const d = wavePath(300, 200, 20, 3);
    expect(d.startsWith('M 0 20')).toBe(true);
    expect(d.endsWith('L 300 200 L 0 200 Z')).toBe(true);
    expect(d.match(/C /g)).toHaveLength(6); // two curves per wave
  });
});
