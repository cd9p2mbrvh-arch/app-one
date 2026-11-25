import { DIAL_MAX, DIAL_MIN } from '../dialMath';
import {
  angleDelta,
  rotationForValue,
  settledValue,
  valueAfterTurn,
  valueAtTouch,
  wheelAngleOf,
} from '../wheelMath';

const screenAngle = (minute: number, value: number) =>
  (((wheelAngleOf(minute) + rotationForValue(value)) % 360) + 360) % 360;

describe('wheel layout', () => {
  it('brings the current value under the top marker', () => {
    for (const v of [5, 10, 33, 60]) expect(screenAngle(v, v)).toBe(0);
  });

  it('shows the next higher number just left of the marker (turn clockwise to add)', () => {
    expect(screenAngle(11, 10)).toBe(354);
    expect(screenAngle(9, 10)).toBe(6);
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
  it('adds a minute per 6° clockwise and removes one per 6° back', () => {
    expect(valueAfterTurn(10, 6)).toBe(11);
    expect(valueAfterTurn(10, -12)).toBe(8);
    expect(valueAfterTurn(10, 3)).toBe(10.5);
  });

  it('stops at both ends', () => {
    expect(valueAfterTurn(58, 60)).toBe(DIAL_MAX);
    expect(valueAfterTurn(6, -60)).toBe(DIAL_MIN);
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
    // With 10 under the marker, 25 is 90° to the left (270°).
    expect(valueAtTouch(270, 10)).toBe(25);
    expect(valueAtTouch(0, 10)).toBe(10);
    // 60 sits 300° anticlockwise of 10, i.e. 60° to the right.
    expect(valueAtTouch(60, 10)).toBe(60);
  });

  it('sends taps in the empty gap to the nearer end', () => {
    // With 10 at the top, minute 1 is at 54° and minute 4 at 36°.
    expect(valueAtTouch(54, 10)).toBe(DIAL_MAX);
    expect(valueAtTouch(36, 10)).toBe(DIAL_MIN);
  });
});
