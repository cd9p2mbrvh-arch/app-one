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
    [90, 15],
    [180, 30],
    [270, 45],
    [0, 60],
    [359, 60],
    [6, 3], // 1 minute is below the minimum
    [60, 10],
  ])('a tap at %i° gives %i minutes', (angle, minutes) => {
    expect(valueForTap(angle)).toBe(minutes);
  });
});

describe('valueForDrag', () => {
  it('follows the finger', () => {
    expect(valueForDrag(10, 66)).toBe(11);
    expect(valueForDrag(30, 240)).toBe(40);
  });

  it('stops at 60 instead of flipping past the top', () => {
    expect(valueForDrag(59, 0)).toBe(60);
    expect(valueForDrag(60, 30)).toBe(60);
  });

  it('stops at the minimum instead of flipping backwards past the top', () => {
    expect(valueForDrag(4, 350)).toBe(3);
    expect(valueForDrag(3, 0)).toBe(3);
  });
});

describe('angleForValue', () => {
  it('places the knob like a clock hand', () => {
    expect(angleForValue(15)).toBe(90);
    expect(angleForValue(60)).toBe(360);
    expect(angleForValue(1)).toBe(18); // clamped to 3 minutes
  });
});

describe('stepValue', () => {
  it('steps by one minute up to 10, then by five', () => {
    expect(stepValue(3, 1)).toBe(4);
    expect(stepValue(9, 1)).toBe(10);
    expect(stepValue(10, 1)).toBe(15);
    expect(stepValue(12, 1)).toBe(15);
    expect(stepValue(60, 1)).toBe(60);
  });

  it('steps back the same way', () => {
    expect(stepValue(15, -1)).toBe(10);
    expect(stepValue(12, -1)).toBe(10);
    expect(stepValue(10, -1)).toBe(9);
    expect(stepValue(3, -1)).toBe(3);
  });

  it('reaches 60 from 3 in 17 steps', () => {
    let v = 3;
    let steps = 0;
    while (v < 60) {
      v = stepValue(v, 1);
      steps++;
    }
    expect(steps).toBe(17);
  });
});

describe('pointAt', () => {
  it('puts 0° at the top and 90° on the right', () => {
    expect(pointAt(0, 10).y).toBeCloseTo(-10);
    expect(pointAt(90, 10).x).toBeCloseTo(10);
  });
});
