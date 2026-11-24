import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { getTabSound, majorTick, playTabSound, resetSounds, setTabSound, tap, tick } from '..';

beforeEach(() => {
  jest.clearAllMocks();
  resetSounds();
});

describe('haptics', () => {
  it('uses the gentle selection haptic for dial ticks', () => {
    tick();
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
  });

  it('uses a light impact for major ticks and a medium one for taps', () => {
    majorTick();
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith('light');
    tap();
    expect(Haptics.impactAsync).toHaveBeenLastCalledWith('medium');
  });

  it('never throws when haptics fail', async () => {
    (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('no engine'));
    expect(() => tick()).not.toThrow();
  });
});

describe('playTabSound', () => {
  it('defaults to the swish', () => {
    expect(getTabSound()).toBe('swish');
  });

  it('creates one player per sound, rewinds and plays it each time', () => {
    playTabSound();
    playTabSound();
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    const player = (createAudioPlayer as jest.Mock).mock.results[0].value;
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(2);
    expect(player.volume).toBeLessThan(0.5);
  });

  it('swallows audio errors', () => {
    (createAudioPlayer as jest.Mock).mockImplementationOnce(() => {
      throw new Error('audio unavailable');
    });
    expect(() => playTabSound()).not.toThrow();
  });

  it('uses a separate player after switching sound', () => {
    playTabSound();
    setTabSound('chime');
    playTabSound();
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
    expect(getTabSound()).toBe('chime');
  });
});
