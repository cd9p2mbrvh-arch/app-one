import { createAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { majorTick, playWhoosh, resetSounds, tap, tick } from '..';

beforeEach(() => {
  jest.clearAllMocks();
  resetSounds();
});

describe('haptics', () => {
  it('uses a medium impact for ticks and taps', () => {
    tick();
    tap();
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(2);
    expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
  });

  it('uses a heavy impact for major ticks', () => {
    majorTick();
    expect(Haptics.impactAsync).toHaveBeenCalledWith('heavy');
  });

  it('never throws when haptics fail', async () => {
    (Haptics.impactAsync as jest.Mock).mockRejectedValueOnce(new Error('no engine'));
    expect(() => tick()).not.toThrow();
  });
});

describe('playWhoosh', () => {
  it('creates one player, rewinds and plays it each time', () => {
    playWhoosh();
    playWhoosh();
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
    expect(() => playWhoosh()).not.toThrow();
  });
});
