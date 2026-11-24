import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme as render } from '@/test/render';

import { ChunkyButton } from '../ChunkyButton';

describe('ChunkyButton', () => {
  it('shows its title in upper case and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<ChunkyButton title="Start session" onPress={onPress} />);

    expect(screen.getByText('START SESSION')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Start session' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<ChunkyButton title="Start" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Start' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});
