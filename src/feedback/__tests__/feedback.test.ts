import * as Haptics from 'expo-haptics';

import { majorTick, tap, tick } from '..';

beforeEach(() => {
  jest.clearAllMocks();
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
