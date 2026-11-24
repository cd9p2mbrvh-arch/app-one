import { fireEvent, screen } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import { renderWithTheme as render } from '@/test/render';

import { DurationDial } from '../DurationDial';
import { pointAt } from '../dialMath';

const SIZE = 300;
const C = SIZE / 2;

/** A touch event at a clock position, given in minutes (0–60). */
const at = (minutes: number, radius = 120) => {
  const p = pointAt(minutes * 6, radius);
  return { nativeEvent: { locationX: C + p.x, locationY: C + p.y } };
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

    await fireEvent(dial, 'responderGrant', at(30));
    await fireEvent(dial, 'responderRelease', at(30));

    expect(dial).toHaveAccessibilityValue({ text: '30 minutes' });
    expect(onChange).toHaveBeenCalledWith(30);
  });

  it('reaches 60 with a single tap at the top', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(0));
    await fireEvent(dial, 'responderRelease', at(0));
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it('follows a drag and does not flip past 60', async () => {
    const { dial, onChange } = await setup(50);

    await fireEvent(dial, 'responderGrant', at(50));
    await fireEvent(dial, 'responderMove', at(58));
    expect(dial).toHaveAccessibilityValue({ text: '58 minutes' });
    await fireEvent(dial, 'responderMove', at(2)); // past the top
    expect(dial).toHaveAccessibilityValue({ text: '60 minutes' });
    await fireEvent(dial, 'responderRelease', at(2));

    expect(onChange).toHaveBeenLastCalledWith(60);
  });

  it('ticks every minute and ticks harder on 5-minute marks', async () => {
    const { dial } = await setup(10);
    await fireEvent(dial, 'responderGrant', at(10));
    await fireEvent(dial, 'responderMove', at(11));
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith('medium');
    await fireEvent(dial, 'responderMove', at(15));
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith('heavy');
  });

  it('supports VoiceOver steps', async () => {
    const { dial, onChange } = await setup(10);
    await fireEvent(dial, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    expect(onChange).toHaveBeenCalledWith(15);
    expect(dial).toHaveAccessibilityValue({ text: '15 minutes' });
  });
});
