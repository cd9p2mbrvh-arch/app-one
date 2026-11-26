import { act, fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { renderWithTheme as render } from '@/test/render';

import { pointAt } from '../dialMath';
import { TimeWheel } from '../TimeWheel';

const SIZE = 300;
const C = SIZE / 2;

/** A touch at a screen angle (0° = top, clockwise), at time `t` ms. */
const at = (angle: number, t = 0, radius = 120) => {
  const p = pointAt(angle, radius);
  return { nativeEvent: { locationX: C + p.x, locationY: C + p.y, timestamp: t } };
};

async function setup(value = 10) {
  const onChange = jest.fn();
  await render(<TimeWheel value={value} onChange={onChange} size={SIZE} testID="dial" />);
  return { onChange, dial: screen.getByRole('adjustable', { name: 'Time' }) };
}

/** Turn the wheel from the top by `degrees` (clockwise positive) in 1° steps. */
// The wheel adds time when turned anticlockwise, so negative degrees add time.
async function turn(dial: ReturnType<typeof screen.getByRole>, degrees: number, msPerDeg = 20) {
  await fireEvent(dial, 'responderGrant', at(0, 0));
  const dir = Math.sign(degrees);
  for (let d = 1; d <= Math.abs(degrees); d++) {
    await fireEvent(dial, 'responderMove', at(dir * d, d * msPerDeg));
  }
  await fireEvent(dial, 'responderRelease', at(degrees, Math.abs(degrees) * msPerDeg));
}

beforeEach(() => jest.clearAllMocks());

describe('TimeWheel', () => {
  it('shows the current value under the marker and in the centre', async () => {
    const { dial } = await setup(25);
    expect(dial).toHaveAccessibilityValue({ text: '25 minutes' });
    expect(screen.getByTestId('dial-value')).toHaveTextContent('25');
  });

  it('turns the whole wheel: anticlockwise adds a minute per 12°', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, -60);
    expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
    expect(onChange).toHaveBeenLastCalledWith(15);
    const style = screen.getByTestId('dial-wheel').props.style as { transform?: unknown }[];
    const rotate = JSON.stringify(style).match(/"rotate":"([-\d.]+)deg"/)?.[1];
    expect(Number(rotate)).toBeCloseTo(-180); // 15 minutes × 12°, anticlockwise
  });

  it('turning clockwise removes time and stops at 5 minutes', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, 90);
    expect(dial).toHaveAccessibilityValue({ text: '5 minutes' });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('stops at 30 minutes', async () => {
    const { dial, onChange } = await setup(25);
    await turn(dial, -90);
    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it('settles on the nearest whole minute', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, -20); // 1.67 minutes
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  describe('tapping a number', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const tapAt = async (dial: ReturnType<typeof screen.getByRole>, angle: number) => {
      await fireEvent(dial, 'responderGrant', at(angle));
      await fireEvent(dial, 'responderRelease', at(angle));
    };
    const wait = (ms: number) => act(() => jest.advanceTimersByTime(ms));

    it('spins smoothly to it, counting through the minutes', async () => {
      const { dial, onChange } = await setup(10);
      // With 10 at the top, 25 is half a turn away.
      await tapAt(dial, 180);
      expect(onChange).not.toHaveBeenCalled(); // not a jump

      await wait(250); // part way
      const mid = Number(screen.getByTestId('dial-value').props.children);
      expect(mid).toBeGreaterThan(10);
      expect(mid).toBeLessThan(25);

      await wait(600);
      expect(onChange).toHaveBeenCalledWith(25);
      expect(dial).toHaveAccessibilityValue({ text: '25 minutes' });
      expect(Haptics.impactAsync).toHaveBeenCalled(); // clicks on the way
    });

    it('spins backwards to a lower number the same way', async () => {
      const { dial, onChange } = await setup(25);
      // With 25 at the top, 10 is half a turn away.
      await tapAt(dial, 180);
      await wait(250);
      const mid = Number(screen.getByTestId('dial-value').props.children);
      expect(mid).toBeLessThan(25);
      expect(mid).toBeGreaterThan(10);
      await wait(600);
      expect(onChange).toHaveBeenLastCalledWith(10);
    });

    it('is quick: never longer than about two thirds of a second', async () => {
      const { dial, onChange } = await setup(5);
      await tapAt(dial, 300); // 30, the farthest number
      await wait(700);
      expect(onChange).toHaveBeenCalledWith(30);
    });

    it('gives VoiceOver the new value at once', async () => {
      const { dial, onChange } = await setup(10);
      await fireEvent(dial, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
      expect(onChange).toHaveBeenCalledWith(15);
      expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
    });
  });

  it('ignores a tap in the centre', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(270, 0, 10));
    await fireEvent(dial, 'responderRelease', at(270, 0, 10));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('clicks firmly each minute when turning slowly, strongest on 5-minute marks', async () => {
    const { dial } = await setup(10);
    await turn(dial, -60, 100); // 1 minute per 1.2 s
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(5);
    expect(jest.mocked(Haptics.impactAsync).mock.calls.map((c) => c[0])).toEqual([
      'medium', // 11
      'medium',
      'medium',
      'medium', // 14
      'heavy', // 15
    ]);
  });

  it('ticks when a minute line reaches the marker, not halfway', async () => {
    const { dial } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(0, 0));
    await fireEvent(dial, 'responderMove', at(-8, 400)); // 10.67: past halfway
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId('dial-value')).toHaveTextContent('10');
    await fireEvent(dial, 'responderMove', at(-12, 600)); // line 11 at the marker
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(screen.getByTestId('dial-value')).toHaveTextContent('11');
  });

  it('only clicks on 5-minute marks during a fast spin', async () => {
    const { dial } = await setup(10);
    await turn(dial, -240, 2); // ~40 min/s
    expect(dial).toHaveAccessibilityValue({ text: '30 minutes' });
    expect(jest.mocked(Haptics.impactAsync).mock.calls.map((c) => c[0])).toEqual([
      'heavy', // 15
      'heavy',
      'heavy',
      'heavy', // 30
    ]);
  });
});
