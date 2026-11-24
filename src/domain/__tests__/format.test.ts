import { formatClock } from '../format';

describe('formatClock', () => {
  it.each([
    [0, '00:00'],
    [400, '00:01'],
    [59000, '00:59'],
    [60000, '01:00'],
    [10 * 60000, '10:00'],
    [60 * 60000, '60:00'],
    [-5, '00:00'],
  ])('%i ms → %s', (ms, text) => {
    expect(formatClock(ms)).toBe(text);
  });
});
