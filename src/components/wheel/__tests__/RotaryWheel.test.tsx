import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native';

import { renderWithTheme as render } from '@/test/render';

import { RotaryWheel, type WheelItem } from '../RotaryWheel';

const items: WheelItem[] = [
  { key: 'a', label: 'Alpha', icon: 'sunny' },
  { key: 'b', label: 'Beta', icon: 'moon' },
  { key: 'c', label: 'Gamma', icon: 'leaf', locked: true, lockHint: 'Unlocks at level 3' },
  { key: 'd', label: 'Delta', icon: 'star' },
];

async function setup(selectedIndex = 0) {
  const onChange = jest.fn();
  const utils = await render(
    <RotaryWheel
      items={items}
      selectedIndex={selectedIndex}
      onChange={onChange}
      accessibilityLabel="Theme"
      size={300}
      testID="wheel"
      renderCenter={(item) => <Text testID="center">{item.label}</Text>}
    />,
  );
  return { onChange, ...utils };
}

const wheel = () => screen.getByRole('adjustable', { name: 'Theme' });
const action = (name: 'increment' | 'decrement') =>
  fireEvent(wheel(), 'accessibilityAction', { nativeEvent: { actionName: name } });

beforeEach(() => jest.clearAllMocks());

describe('RotaryWheel', () => {
  it('announces the item at the top', async () => {
    await setup(1);
    expect(wheel()).toHaveAccessibilityValue({ text: 'Beta' });
    expect(screen.getByTestId('center')).toHaveTextContent('Beta');
  });

  it('turns one step with accessibility actions and ticks', async () => {
    const { onChange } = await setup(0);

    await action('increment');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(1));
    expect(Haptics.selectionAsync).toHaveBeenCalled();
    expect(wheel()).toHaveAccessibilityValue({ text: 'Beta' });
  });

  it('wraps around backwards from the first item', async () => {
    const { onChange } = await setup(0);

    await action('decrement');
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(3));
  });

  it('turns to an item when it is tapped', async () => {
    const { onChange } = await setup(0);

    await fireEvent.press(screen.getByTestId('wheel-item-d'));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(3));
  });

  it('says when the item at the top is locked', async () => {
    await setup(2);
    expect(wheel()).toHaveAccessibilityValue({ text: 'Gamma, locked. Unlocks at level 3' });
  });

  it('marks only locked items with a padlock', async () => {
    await setup(0);
    expect(screen.getByTestId('wheel-lock-c')).toBeTruthy();
    expect(screen.queryByTestId('wheel-lock-a')).toBeNull();
  });

  it('follows a new selection from its parent', async () => {
    const onChange = jest.fn();
    const props = {
      items,
      onChange,
      accessibilityLabel: 'Theme',
      size: 300,
    };
    const { rerender } = await render(<RotaryWheel {...props} selectedIndex={0} />);
    await act(() => rerender(<RotaryWheel {...props} selectedIndex={3} />));

    expect(wheel()).toHaveAccessibilityValue({ text: 'Delta' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
