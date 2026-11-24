import { fireEvent, screen } from '@testing-library/react-native';

import { renderWithTheme as render } from '@/test/render';

import { OptionCard } from '../OptionCard';

describe('OptionCard', () => {
  it('exposes selected state for accessibility', async () => {
    await render(<OptionCard label="Health" icon="leaf-outline" selected onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Health' })).toBeSelected();
  });

  it('is not selected by default and reports presses', async () => {
    const onPress = jest.fn();
    await render(<OptionCard label="Gratitude" onPress={onPress} />);

    const card = screen.getByRole('button', { name: 'Gratitude' });
    expect(card).not.toBeSelected();
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
