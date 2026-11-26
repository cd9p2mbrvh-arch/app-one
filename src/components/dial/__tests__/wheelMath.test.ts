import { DIAL_MAX, DIAL_MIN } from '../dialMath';
import {
  angleDelta,
  crossedMinute,
  rotationForValue,
  settledValue,
  valueAfterTurn,
  valueAtTouch,
  wheelAngleOf,
  WHEEL_DIRECTION,
  WHEEL_LABELS,
} from '../wheelMath';

const screenAngle = (minute: number, value: number) =>
  (((wheelAngleOf(minute) + rotationForValue(value)) % 360) + 360) % 360;

describe('wheel layout', () => {
  it('brings the current value under the top marker', () => {
    for (const v of [5, 10, 17, 30]) expect(screenAngle(v, v)).toBe(0);
  });

  it('shows the next higher number just right of the marker (turn anticlockwise to add)', () => {
    expect(WHEEL_DIRECTION).toBe(-1);
    expect(screenAngle(11, 10)).toBe(12);
    expect(screenAngle(9, 10)).toBe(348);
  });
});

describe('wheel numbers', () => {
  it('shows 5, 10, 15, 20, 25 and 30', () => {
    expect(WHEEL_LABELS).toEqual([5, 10, 15, 20, 25, 30]);
  });

  it('never puts two numbers close together, including 30 and 5', () => {
    const angles = WHEEL_LABELS.map((m) => screenAngle(m, 10)).sort((a, b) => a - b);
    const gaps = angles.map((a, i) => (i === 0 ? a + 360 - angles.at(-1)! : a - angles[i - 1]));
    for (const gap of gaps) expect(gap).toBeCloseTo(60);
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
  it('adds a minute per 12° anticlockwise and removes one per 12° clockwise', () => {
    expect(valueAfterTurn(10, -12)).toBe(11);
    expect(valueAfterTurn(10, 24)).toBe(8);
    expect(valueAfterTurn(10, -6)).toBe(10.5);
  });

  it('stops at both ends', () => {
    expect(valueAfterTurn(28, -60)).toBe(DIAL_MAX);
    expect(valueAfterTurn(6, 60)).toBe(DIAL_MIN);
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
  it('returns the number printed where the finger touched', () => {
    // With 10 under the marker, 25 is half a turn away (15 minutes × 12°).
    expect(valueAtTouch(180, 10)).toBe(25);
    expect(valueAtTouch(0, 10)).toBe(10);
    // 30 sits 240° clockwise of 10.
    expect(valueAtTouch(240, 10)).toBe(30);
  });

  it('sends taps in the empty gap to the nearer end', () => {
    // With 10 at the top, minute 1 is at 252° and minute 4 at 288°.
    expect(valueAtTouch(252, 10)).toBe(DIAL_MAX);
    expect(valueAtTouch(288, 10)).toBe(DIAL_MIN);
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
