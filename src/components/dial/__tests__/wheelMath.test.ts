import { DIAL_MAX, DIAL_MIN } from '../dialMath';
import {
  angleDelta,
  crossedMinute,
  rotationForValue,
  settledValue,
  valueAfterTurn,
  valueAtTouch,
  WHEEL_DEG_PER_MINUTE as D,
  WHEEL_DIRECTION,
  WHEEL_STEPS,
  wheelAngleOf,
} from '../wheelMath';

const screenAngle = (minute: number, value: number) =>
  (((wheelAngleOf(minute) + rotationForValue(value)) % 360) + 360) % 360;

describe('wheel layout', () => {
  it('spreads 5–30 over the whole wheel with no empty part', () => {
    expect(WHEEL_STEPS).toBe(26);
    expect(D).toBeCloseTo(13.85, 2);
    // 30 sits one minute-step away from 5.
    expect(screenAngle(30, 5)).toBeCloseTo(360 - D);
  });

  it('brings the current value under the top marker', () => {
    for (const v of [5, 10, 17, 30]) expect(screenAngle(v, v) % 360).toBeCloseTo(0);
  });

  it('shows the next higher number just right of the marker (turn anticlockwise to add)', () => {
    expect(WHEEL_DIRECTION).toBe(-1);
    expect(screenAngle(11, 10)).toBeCloseTo(D);
    expect(screenAngle(9, 10)).toBeCloseTo(360 - D);
  });
});

describe('angleDelta', () => {
  it('takes the short way round', () => {
    expect(angleDelta(10, 30)).toBe(20);
    expect(angleDelta(350, 10)).toBe(20);
    expect(angleDelta(10, 350)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
  });
});

describe('valueAfterTurn', () => {
  it('adds a minute per step anticlockwise and removes one per step clockwise', () => {
    expect(valueAfterTurn(10, -D)).toBe(11);
    expect(valueAfterTurn(10, 2 * D)).toBe(8);
    expect(valueAfterTurn(10, -D / 2)).toBe(10.5);
  });

  it('stops at both ends', () => {
    expect(valueAfterTurn(28, -5 * D)).toBe(DIAL_MAX);
    expect(valueAfterTurn(6, 5 * D)).toBe(DIAL_MIN);
  });
});

describe('settledValue', () => {
  it('rounds to the nearest minute inside the range', () => {
    expect(settledValue(10.4)).toBe(10);
    expect(settledValue(10.6)).toBe(11);
    expect(settledValue(2)).toBe(DIAL_MIN);
  });
});

describe('valueAtTouch', () => {
  it('returns the minute where the finger touched', () => {
    expect(valueAtTouch(15 * D, 10)).toBe(25);
    expect(valueAtTouch(0, 10)).toBe(10);
    expect(valueAtTouch(20 * D, 10)).toBe(30);
    expect(valueAtTouch(360 - 5 * D, 10)).toBe(5);
  });

  it('tells 30 and 5 apart even though they are neighbours', () => {
    expect(valueAtTouch(20 * D + 2, 10)).toBe(30);
    expect(valueAtTouch(21 * D - 2, 10)).toBe(5);
  });
});

describe('crossedMinute', () => {
  it('reports a minute only when its line reaches the marker', () => {
    expect(crossedMinute(10, 10.4)).toBeNull();
    expect(crossedMinute(10.4, 10.6)).toBeNull(); // halfway is not a mark
    expect(crossedMinute(10.9, 11)).toBe(11);
    expect(crossedMinute(10.9, 11.2)).toBe(11);
  });

  it('works turning back too', () => {
    expect(crossedMinute(11, 10.6)).toBeNull();
    expect(crossedMinute(10.1, 9.95)).toBe(10);
    expect(crossedMinute(10, 9.5)).toBeNull();
    expect(crossedMinute(9.2, 9)).toBe(9);
  });

  it('turning back and forth inside a minute does not tick', () => {
    expect(crossedMinute(10.7, 10.5)).toBeNull();
    expect(crossedMinute(10.5, 10.8)).toBeNull();
  });

  it('returns the last line when several pass in one move', () => {
    expect(crossedMinute(10.5, 13.2)).toBe(13);
    expect(crossedMinute(13.2, 10.5)).toBe(11);
  });
});
