import { act } from '@testing-library/react-native';

import {
  canBegin,
  chosenItem,
  defaultSelection,
  isStepLocked,
  useSessionSetup,
} from '../sessionSetup';

describe('defaultSelection', () => {
  it('picks the first theme, first unlocked voice and music, and 10 minutes', () => {
    expect(defaultSelection(1)).toEqual({
      theme: 'abundance',
      voice: 'voice1',
      music: 'music1',
      duration: 10,
    });
  });

  it('can always begin with the defaults', () => {
    expect(canBegin(defaultSelection(1), 1)).toBe(true);
  });
});

describe('locks', () => {
  const sel = { ...defaultSelection(), voice: 'voice5' };

  it('detects a locked choice for the current level', () => {
    expect(isStepLocked(sel, 'voice', 1)).toBe(true);
    expect(isStepLocked(sel, 'voice', 3)).toBe(false);
    expect(isStepLocked(sel, 'duration', 1)).toBe(false);
  });

  it('blocks starting while something locked is chosen', () => {
    expect(canBegin(sel, 1)).toBe(false);
    expect(canBegin(sel, 3)).toBe(true);
  });

  it('finds the chosen catalogue item', () => {
    expect(chosenItem(sel, 'voice')?.label).toBe('Voice 5');
    expect(chosenItem(sel, 'duration')).toBeUndefined();
  });
});

describe('useSessionSetup store', () => {
  afterEach(async () => {
    await act(() => useSessionSetup.getState().reset());
  });

  it('records choices and resets to defaults', async () => {
    await act(() => useSessionSetup.getState().choose('music', 'music2'));
    expect(useSessionSetup.getState().music).toBe('music2');

    await act(() => useSessionSetup.getState().reset());
    expect(useSessionSetup.getState().music).toBe('music1');
  });
});
