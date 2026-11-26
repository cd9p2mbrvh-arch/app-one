import { fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { renderWithTheme as render } from '@/test/render';

import { pointAt } from '../dialMath';
import { TimeWheel } from '../TimeWheel';
import { WHEEL_DEG_PER_MINUTE as D } from '../wheelMath';

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

/**
 * Turn the wheel from the top by `degrees` (clockwise positive) in small steps,
 * `msPerDeg` apart. The wheel adds time when turned anticlockwise, so negative
 * degrees add time.
 */
async function turn(dial: ReturnType<typeof screen.getByRole>, degrees: number, msPerDeg = 20) {
  await fireEvent(dial, 'responderGrant', at(0, 0));
  const n = Math.ceil(Math.abs(degrees));
  for (let i = 1; i <= n; i++) {
    const a = (degrees * i) / n;
    await fireEvent(dial, 'responderMove', at(a, Math.abs(a) * msPerDeg));
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

  it('turns the whole wheel: anticlockwise adds a minute per step', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, -5 * D);
    expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
    expect(onChange).toHaveBeenLastCalledWith(15);
    const style = screen.getByTestId('dial-wheel').props.style as { transform?: unknown }[];
    const rotate = JSON.stringify(style).match(/"rotate":"([-\d.]+)deg"/)?.[1];
    expect(Number(rotate)).toBeCloseTo(-10 * D); // 10 steps past 5, anticlockwise
  });

  it('turning clockwise removes time and stops at 5 minutes', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, 8 * D);
    expect(dial).toHaveAccessibilityValue({ text: '5 minutes' });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('stops at 30 minutes', async () => {
    const { dial, onChange } = await setup(25);
    await turn(dial, -8 * D);
    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it('settles on the nearest whole minute', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, -1.67 * D); // 1.67 minutes
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it('turns straight to a tapped number', async () => {
    const { dial, onChange } = await setup(10);
    // With 10 at the top, 25 is 15 steps away.
    await fireEvent(dial, 'responderGrant', at(15 * D));
    await fireEvent(dial, 'responderRelease', at(15 * D));
    expect(onChange).toHaveBeenCalledWith(25);
    expect(dial).toHaveAccessibilityValue({ text: '25 minutes' });
  });

  it('ignores a tap in the centre', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(270, 0, 10));
    await fireEvent(dial, 'responderRelease', at(270, 0, 10));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('clicks firmly each minute when turning slowly, strongest on 5-minute marks', async () => {
    const { dial } = await setup(10);
    await turn(dial, -5 * D, 100); // about 1 minute per 1.4 s
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
    await fireEvent(dial, 'responderMove', at(-0.67 * D, 400)); // 10.67: past halfway
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId('dial-value')).toHaveTextContent('10');
    await fireEvent(dial, 'responderMove', at(-D, 600)); // line 11 at the marker
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
    expect(screen.getByTestId('dial-value')).toHaveTextContent('11');
  });

  it('only clicks on 5-minute marks during a fast spin', async () => {
    const { dial } = await setup(10);
    await turn(dial, -20 * D, 2); // ~36 min/s
    expect(dial).toHaveAccessibilityValue({ text: '30 minutes' });
    expect(jest.mocked(Haptics.impactAsync).mock.calls.map((c) => c[0])).toEqual([
      'heavy', // 15
      'heavy',
      'heavy',
      'heavy', // 30
    ]);
  });

  it('supports VoiceOver steps', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(15);
    expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
  });
});
