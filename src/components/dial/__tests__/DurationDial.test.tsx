import { fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { renderWithTheme as render } from '@/test/render';

import { DurationDial } from '../DurationDial';
import { DEG_PER_MINUTE, pointAt } from '../dialMath';

const SIZE = 300;
const C = SIZE / 2;

/** A touch event at a dial position (minutes 0–30), at time `t` ms. */
const at = (minutes: number, t = 0, radius = 120) => {
  const p = pointAt(minutes * DEG_PER_MINUTE, radius);
  return { nativeEvent: { locationX: C + p.x, locationY: C + p.y, timestamp: t } };
};

async function setup(value = 10) {
  const onChange = jest.fn();
  await render(<DurationDial value={value} onChange={onChange} size={SIZE} testID="dial" />);
  return { onChange, dial: screen.getByRole('adjustable', { name: 'Time' }) };
}

beforeEach(() => jest.clearAllMocks());

describe('DurationDial', () => {
  it('shows the current value', async () => {
    const { dial } = await setup(25);
    expect(dial).toHaveAccessibilityValue({ text: '25 minutes' });
    expect(screen.getByTestId('dial-value')).toHaveTextContent('25');
  });

  it('jumps straight to a tapped position', async () => {
    const { dial, onChange } = await setup(10);

    await fireEvent(dial, 'responderGrant', at(20));
    await fireEvent(dial, 'responderRelease', at(20));

    expect(dial).toHaveAccessibilityValue({ text: '20 minutes' });
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('reaches 30 with a single tap at the top', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(0));
    await fireEvent(dial, 'responderRelease', at(0));
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('follows a drag and does not flip past 30', async () => {
    const { dial, onChange } = await setup(25);

    await fireEvent(dial, 'responderGrant', at(25));
    await fireEvent(dial, 'responderMove', at(28));
    expect(dial).toHaveAccessibilityValue({ text: '28 minutes' });
    await fireEvent(dial, 'responderMove', at(2)); // past the top
    expect(dial).toHaveAccessibilityValue({ text: '30 minutes' });
    await fireEvent(dial, 'responderRelease', at(2));

    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it('ticks gently each minute when moving slowly, firmer on 5-minute marks', async () => {
    const { dial } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(10, 0));
    await fireEvent(dial, 'responderMove', at(11, 500));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    await fireEvent(dial, 'responderMove', at(12, 1000));
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(2);
    await fireEvent(dial, 'responderMove', at(15, 1500));
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
  });

  it('only clicks on 5-minute marks during a fast spin', async () => {
    const { dial } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(10, 0));
    for (let m = 11; m <= 30; m++) {
      await fireEvent(dial, 'responderMove', at(m, (m - 10) * 15)); // ~67 min/s
    }
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
