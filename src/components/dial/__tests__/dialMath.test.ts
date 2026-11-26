import { angleForValue, angleOf, pointAt, stepValue, valueForDrag, valueForTap } from '../dialMath';

describe('angleOf', () => {
  it('measures clockwise from the top in [0, 360)', () => {
    expect(angleOf(0, -10, 0, 0)).toBeCloseTo(0);
    expect(angleOf(10, 0, 0, 0)).toBeCloseTo(90);
    expect(angleOf(0, 10, 0, 0)).toBeCloseTo(180);
    expect(angleOf(-10, 0, 0, 0)).toBeCloseTo(270);
  });
});

describe('valueForTap', () => {
  it.each([
    [180, 15],
    [90, 8], // 7.5 rounds up
    [0, 30],
    [359, 30],
    [12, 5], // 1 minute is below the minimum
    [48, 5],
    [120, 10],
    [300, 25],
  ])('a tap at %i° gives %i minutes', (angle, minutes) => {
    expect(valueForTap(angle)).toBe(minutes);
  });
});

describe('valueForDrag', () => {
  it('follows the finger', () => {
    expect(valueForDrag(10, 132)).toBe(11);
    expect(valueForDrag(20, 300)).toBe(25);
  });

  it('stops at 30 instead of flipping past the top', () => {
    expect(valueForDrag(29, 0)).toBe(30);
    expect(valueForDrag(30, 12)).toBe(30);
  });

  it('stops at the minimum instead of flipping backwards past the top', () => {
    expect(valueForDrag(6, 350)).toBe(5);
    expect(valueForDrag(5, 0)).toBe(5);
  });
});

describe('angleForValue', () => {
  it('places the knob like a clock hand (one circle = 30 minutes)', () => {
    expect(angleForValue(15)).toBe(180);
    expect(angleForValue(30)).toBe(360);
    expect(angleForValue(1)).toBe(60); // clamped to 5 minutes
  });
});

describe('stepValue', () => {
  it('steps by one minute up to 10, then by five', () => {
    expect(stepValue(5, 1)).toBe(6);
    expect(stepValue(9, 1)).toBe(10);
    expect(stepValue(10, 1)).toBe(15);
    expect(stepValue(12, 1)).toBe(15);
    expect(stepValue(30, 1)).toBe(30);
  });

  it('steps back the same way', () => {
    expect(stepValue(15, -1)).toBe(10);
    expect(stepValue(12, -1)).toBe(10);
    expect(stepValue(10, -1)).toBe(9);
    expect(stepValue(5, -1)).toBe(5);
  });

  it('reaches 30 from 5 in 9 steps', () => {
    let v = 5;
    let steps = 0;
    while (v < 30) {
      v = stepValue(v, 1);
      steps++;
    }
    expect(steps).toBe(9);
  });
});

describe('pointAt', () => {
  it('puts 0° at the top and 90° on the right', () => {
    expect(pointAt(0, 10).y).toBeCloseTo(-10);
    expect(pointAt(90, 10).x).toBeCloseTo(10);
  });
});
