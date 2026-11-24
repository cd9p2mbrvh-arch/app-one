import { delayBetween, EVENT_GAP_MS, pickEvent } from '../schedule';

describe('delayBetween', () => {
  it('stays within the range', () => {
    expect(delayBetween([6000, 10000], () => 0)).toBe(6000);
    expect(delayBetween([6000, 10000], () => 0.999)).toBe(9996);
    expect(delayBetween(EVENT_GAP_MS, () => 0.5)).toBe(8000);
  });
});

describe('pickEvent', () => {
  const even = [
    { name: 'airplane', weight: 1 },
    { name: 'birds', weight: 1 },
  ] as const;

  it('never repeats the previous event when weights are equal', () => {
    for (const r of [0, 0.3, 0.7, 0.99]) {
      expect(pickEvent(even, 'airplane', () => r)).toBe('birds');
      expect(pickEvent(even, 'birds', () => r)).toBe('airplane');
    }
  });

  it('picks from all events at first', () => {
    expect(pickEvent(even, null, () => 0)).toBe('airplane');
    expect(pickEvent(even, null, () => 0.9)).toBe('birds');
  });

  describe('with a rare event', () => {
    const night = [
      { name: 'shootingStar', weight: 4 },
      { name: 'ufo', weight: 1 },
    ] as const;

    it('never shows the rare event twice in a row', () => {
      for (const r of [0, 0.5, 0.99]) expect(pickEvent(night, 'ufo', () => r)).toBe('shootingStar');
    });

    it('lets the common event repeat, so the rare one stays rare', () => {
      expect(pickEvent(night, 'shootingStar', () => 0.1)).toBe('shootingStar');
      expect(pickEvent(night, 'shootingStar', () => 0.95)).toBe('ufo');
    });

    it('shows the rare event about 1 time in 5 over many picks', () => {
      let prev: 'shootingStar' | 'ufo' | null = null;
      let ufos = 0;
      const random = (() => {
        let a = 7;
        return () => (a = (a * 16807) % 2147483647) / 2147483647;
      })();
      for (let i = 0; i < 5000; i++) {
        prev = pickEvent(night, prev, random);
        if (prev === 'ufo') ufos++;
      }
      expect(ufos / 5000).toBeGreaterThan(0.12);
      expect(ufos / 5000).toBeLessThan(0.22);
    });
  });
});
