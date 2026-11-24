import { formatClock, formatSessionDate, formatSessionLength } from '../format';

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

describe('formatSessionDate', () => {
  it('shows weekday, day, month and time', () => {
    expect(formatSessionDate(new Date(2026, 10, 24, 21, 4))).toBe('Tue 24 Nov · 21:04');
    expect(formatSessionDate(new Date(2026, 0, 1, 7, 30))).toBe('Thu 1 Jan · 07:30');
  });
});

describe('formatSessionLength', () => {
  it('describes completed and early-ended sessions', () => {
    expect(formatSessionLength(true, 10, 600000)).toBe('10 min');
    expect(formatSessionLength(false, 20, 4.5 * 60000)).toBe('4 of 20 min');
    expect(formatSessionLength(false, 20, 30000)).toBe('under 1 of 20 min');
  });
});
