import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { renderWithTheme as render } from '@/test/render';

import { EXPO_GO_CORNER, expoGoCornerInset, HeaderRow } from '../HeaderRow';

describe('Expo Go corner', () => {
  it('keeps the top-right corner free only inside Expo Go', () => {
    expect(expoGoCornerInset('storeClient')).toBe(EXPO_GO_CORNER);
    expect(expoGoCornerInset('standalone')).toBe(0);
    expect(expoGoCornerInset('bare')).toBe(0);
    expect(expoGoCornerInset(undefined)).toBe(0);
  });

  it('renders its content', async () => {
    await render(
      <HeaderRow>
        <Text>Title</Text>
      </HeaderRow>,
    );
    expect(screen.getByText('Title')).toBeTruthy();
  });
});
