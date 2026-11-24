import { act } from '@testing-library/react-native';

import {
  isSetupComplete,
  nextStepAfter,
  useSessionSetup,
  type SetupSelection,
} from '../sessionSetup';

const empty: SetupSelection = { theme: null, voice: null, music: null, duration: null };

describe('nextStepAfter', () => {
  it('moves to the next unfinished step', () => {
    expect(nextStepAfter({ ...empty, theme: 'peace' }, 'theme')).toBe('voice');
  });

  it('skips steps that are already done', () => {
    expect(nextStepAfter({ ...empty, theme: 'peace', voice: 'v1' }, 'theme')).toBe('music');
  });

  it('wraps around to earlier unfinished steps', () => {
    const sel = { ...empty, voice: 'v1', music: 'm1', duration: 10 };
    expect(nextStepAfter(sel, 'duration')).toBe('theme');
  });

  it('stays put when everything is chosen', () => {
    const sel = { theme: 'peace', voice: 'v1', music: 'm1', duration: 10 };
    expect(nextStepAfter(sel, 'music')).toBe('music');
  });
});

describe('isSetupComplete', () => {
  it('requires all four choices', () => {
    expect(isSetupComplete({ ...empty, theme: 'a', voice: 'b', music: 'c' })).toBe(false);
    expect(isSetupComplete({ theme: 'a', voice: 'b', music: 'c', duration: 5 })).toBe(true);
  });
});

describe('useSessionSetup store', () => {
  afterEach(async () => {
    await act(() => useSessionSetup.getState().reset());
  });

  it('records choices and resets', async () => {
    await act(() => useSessionSetup.getState().choose('music', 'music2'));
    expect(useSessionSetup.getState().music).toBe('music2');

    await act(() => useSessionSetup.getState().reset());
    expect(useSessionSetup.getState().music).toBeNull();
  });
});
