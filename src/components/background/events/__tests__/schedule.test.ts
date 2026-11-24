import { delayBetween, EVENT_GAP_MS, pickEvent } from '../schedule';

describe('delayBetween', () => {
  it('stays within the range', () => {
    expect(delayBetween([6000, 10000], () => 0)).toBe(6000);
    expect(delayBetween([6000, 10000], () => 0.999)).toBe(9996);
    expect(delayBetween(EVENT_GAP_MS, () => 0.5)).toBe(8000);
  });
});

describe('pickEvent', () => {
  const names = ['airplane', 'birds'] as const;

  it('never repeats the previous event when there is a choice', () => {
    for (const r of [0, 0.3, 0.7, 0.99]) {
      expect(pickEvent(names, 'airplane', () => r)).toBe('birds');
      expect(pickEvent(names, 'birds', () => r)).toBe('airplane');
    }
  });

  it('picks from all events at first', () => {
    expect(pickEvent(names, null, () => 0)).toBe('airplane');
    expect(pickEvent(names, null, () => 0.9)).toBe('birds');
  });

  it('repeats when there is only one event', () => {
    expect(pickEvent(['ufo'] as const, 'ufo', () => 0.5)).toBe('ufo');
  });
});
