import { act } from '@testing-library/react-native';

import type { Theme } from '@/content/manifest';

import {
  canBegin,
  chosenItem,
  defaultSelection,
  isStepFixed,
  isStepLocked,
  resolveSelection,
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
    expect(chosenItem(sel, 'voice')?.label).toBe('Narrator 5');
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

describe('themes with their own narrator and music', () => {
  const themes: Theme[] = [
    { id: 'peace', label: 'Peace of Mind', icon: 'cloud-outline', unlockLevel: 1 },
    {
      id: 'sleep',
      label: 'Sleep Story',
      icon: 'moon-outline',
      unlockLevel: 1,
      fixed: { voice: 'voice8', music: 'music6' },
    },
    {
      id: 'focus',
      label: 'Focus',
      icon: 'eye-outline',
      unlockLevel: 1,
      fixed: { music: 'music2' },
    },
  ];
  const mine = { theme: 'peace', voice: 'voice2', music: 'music1', duration: 10 };

  it('uses the user’s own choices for a normal theme', () => {
    expect(resolveSelection(mine, themes)).toEqual(mine);
    expect(isStepFixed(mine, 'voice', themes)).toBe(false);
  });

  it('replaces narrator and music with the theme’s own', () => {
    const sel = { ...mine, theme: 'sleep' };
    expect(resolveSelection(sel, themes)).toEqual({ ...sel, voice: 'voice8', music: 'music6' });
    expect(isStepFixed(sel, 'voice', themes)).toBe(true);
    expect(isStepFixed(sel, 'music', themes)).toBe(true);
    expect(isStepFixed(sel, 'duration', themes)).toBe(false);
    expect(chosenItem(sel, 'voice', themes)?.label).toBe('Narrator 8');
  });

  it('can fix only one of them', () => {
    const sel = { ...mine, theme: 'focus' };
    expect(resolveSelection(sel, themes)).toEqual({ ...sel, music: 'music2' });
    expect(isStepFixed(sel, 'voice', themes)).toBe(false);
  });

  it('treats fixed choices as unlocked, even if normally paid or level-locked', () => {
    const sel = { ...mine, theme: 'sleep' };
    expect(isStepLocked(sel, 'voice', 1, new Set(), themes)).toBe(false);
    expect(canBegin(sel, 1, new Set(), themes)).toBe(true);
  });

  it('brings the user’s own choices back when switching to a normal theme', () => {
    const back = { ...mine, theme: 'sleep' };
    expect(resolveSelection({ ...back, theme: 'peace' }, themes).voice).toBe('voice2');
  });
});
