import AsyncStorage from '@react-native-async-storage/async-storage';
import { act } from '@testing-library/react-native';

import { PURCHASES_STORAGE_KEY, sanitizeOwned, usePurchases } from '../purchases';

beforeEach(async () => {
  await AsyncStorage.clear();
  await act(() => usePurchases.setState({ owned: [] }));
});

describe('purchases store (mockup)', () => {
  it('marks a product as owned once', async () => {
    await act(() => usePurchases.getState().buy('narrator.voice7'));
    await act(() => usePurchases.getState().buy('narrator.voice7'));
    expect(usePurchases.getState().owned).toEqual(['narrator.voice7']);
  });

  it('is saved on the device and loaded back', async () => {
    await act(() => usePurchases.getState().buy('music.music5'));
    const raw = (await AsyncStorage.getItem(PURCHASES_STORAGE_KEY))!;
    await act(() => usePurchases.setState({ owned: [] }));
    await AsyncStorage.setItem(PURCHASES_STORAGE_KEY, raw);
    await act(() => usePurchases.persist.rehydrate());
    expect(usePurchases.getState().owned).toEqual(['music.music5']);
  });

  it('can be reset for demos', async () => {
    await act(() => usePurchases.getState().buy('music.music5'));
    await act(() => usePurchases.getState().resetDemo());
    expect(usePurchases.getState().owned).toEqual([]);
  });
});

describe('sanitizeOwned', () => {
  it('keeps unique non-empty strings only', () => {
    expect(sanitizeOwned({ owned: ['a', 'a', '', 3, null, 'b'] })).toEqual(['a', 'b']);
    expect(sanitizeOwned('junk')).toEqual([]);
    expect(sanitizeOwned(null)).toEqual([]);
  });
});
