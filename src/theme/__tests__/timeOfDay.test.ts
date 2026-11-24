import { getTimeOfDay } from '../timeOfDay';

const at = (hour: number, minute = 0) => new Date(2026, 0, 15, hour, minute);

describe('getTimeOfDay', () => {
  it.each([
    [5, 0, 'morning'],
    [8, 30, 'morning'],
    [10, 59, 'morning'],
    [11, 0, 'noon'],
    [14, 0, 'noon'],
    [17, 59, 'noon'],
    [18, 0, 'night'],
    [23, 59, 'night'],
    [0, 0, 'night'],
    [4, 59, 'night'],
  ])('%i:%i is %s', (hour, minute, expected) => {
    expect(getTimeOfDay(at(hour, minute))).toBe(expected);
  });
});
