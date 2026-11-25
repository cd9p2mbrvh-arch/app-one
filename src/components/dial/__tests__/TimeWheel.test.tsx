import { fireEvent, screen } from '@testing-library/react-native';
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

  it('turns the whole wheel: clockwise adds a minute per 6°', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, 30);
    expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
    expect(onChange).toHaveBeenLastCalledWith(15);
    const style = screen.getByTestId('dial-wheel').props.style as { transform?: unknown }[];
    const rotate = JSON.stringify(style).match(/"rotate":"([-\d.]+)deg"/)?.[1];
    expect(Number(rotate)).toBeCloseTo(90); // 15 minutes × 6°
  });

  it('turning anticlockwise removes time and stops at 5 minutes', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, -90);
    expect(dial).toHaveAccessibilityValue({ text: '5 minutes' });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('stops at 60 minutes', async () => {
    const { dial, onChange } = await setup(55);
    await turn(dial, 90);
    expect(onChange).toHaveBeenLastCalledWith(60);
  });

  it('settles on the nearest whole minute', async () => {
    const { dial, onChange } = await setup(10);
    await turn(dial, 10); // 1.67 minutes
    expect(onChange).toHaveBeenLastCalledWith(12);
  });

  it('turns straight to a tapped number', async () => {
    const { dial, onChange } = await setup(10);
    // With 10 at the top, 25 is a quarter turn to the left.
    await fireEvent(dial, 'responderGrant', at(270));
    await fireEvent(dial, 'responderRelease', at(270));
    expect(onChange).toHaveBeenCalledWith(25);
    expect(dial).toHaveAccessibilityValue({ text: '25 minutes' });
  });

  it('ignores a tap in the centre', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(270, 0, 10));
    await fireEvent(dial, 'responderRelease', at(270, 0, 10));
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('ticks each minute when turning slowly, firmer on 5-minute marks', async () => {
    const { dial } = await setup(10);
    await turn(dial, 30, 100); // 1 minute per 600 ms
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(4); // 11–14
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1); // 15
  });

  it('only clicks on 5-minute marks during a fast spin', async () => {
    const { dial } = await setup(10);
    await turn(dial, 120, 2); // ~83 min/s
    expect(dial).toHaveAccessibilityValue({ text: '30 minutes' });
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(4); // 15, 20, 25, 30
  });

  it('supports VoiceOver steps', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(15);
    expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
  });
});
