import {
  angleDelta,
  clampPosition,
  geometryFor,
  indexAt,
  offsetOf,
  placementFor,
  pointerAngle,
  positionFor,
  settlePosition,
} from '../wheelMath';

const four = geometryFor(4);
const long = geometryFor(58);

describe('geometryFor', () => {
  it('spreads small lists around the full circle', () => {
    expect(four).toEqual({ count: 4, wrap: true, stepDeg: 90 });
    expect(geometryFor(6).stepDeg).toBe(60);
  });

  it('uses fixed steps without wrapping for long lists', () => {
    expect(long).toEqual({ count: 58, wrap: false, stepDeg: 30 });
  });
});

describe('indexAt', () => {
  it('rounds to the nearest item and wraps', () => {
    expect(indexAt(0.4, four)).toBe(0);
    expect(indexAt(0.6, four)).toBe(1);
    expect(indexAt(-1, four)).toBe(3);
    expect(indexAt(9, four)).toBe(1);
  });

  it('clamps on long lists', () => {
    expect(indexAt(-3, long)).toBe(0);
    expect(indexAt(100, long)).toBe(57);
  });
});

describe('offsetOf', () => {
  it('takes the short way round on wrapping wheels', () => {
    expect(offsetOf(3, 0, four)).toBe(-1);
    expect(offsetOf(1, 0, four)).toBe(1);
    expect(offsetOf(0, 3.5, four)).toBeCloseTo(0.5);
  });

  it('is a plain difference on long lists', () => {
    expect(offsetOf(10, 7, long)).toBe(3);
  });
});

describe('positionFor', () => {
  it('rotates to an item the short way', () => {
    expect(positionFor(3, 8, four)).toBe(7); // 8 ≡ item 0; item 3 is one step back
    expect(positionFor(20, 7, long)).toBe(20);
  });
});

describe('clampPosition', () => {
  it('only clamps long lists', () => {
    expect(clampPosition(-2, four)).toBe(-2);
    expect(clampPosition(-2, long)).toBe(0);
    expect(clampPosition(70, long)).toBe(57);
  });
});

describe('angles', () => {
  it('measures pointer angle from the top, clockwise', () => {
    expect(pointerAngle(0, -10, 0, 0)).toBeCloseTo(0);
    expect(pointerAngle(10, 0, 0, 0)).toBeCloseTo(90);
    expect(pointerAngle(0, 10, 0, 0)).toBeCloseTo(180);
    expect(pointerAngle(-10, 0, 0, 0)).toBeCloseTo(-90);
  });

  it('finds the smallest signed difference, across the ±180° seam', () => {
    expect(angleDelta(10, 30)).toBe(20);
    expect(angleDelta(170, -170)).toBe(20);
    expect(angleDelta(-170, 170)).toBe(-20);
    expect(angleDelta(0, 180)).toBe(180);
  });
});

describe('placementFor', () => {
  it('puts the current item at the top, fully emphasised', () => {
    const p = placementFor(0, four, 100);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(-100);
    expect(p.emphasis).toBe(1);
  });

  it('places the next item clockwise', () => {
    const p = placementFor(1, four, 100);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(0);
    expect(p.emphasis).toBe(0);
  });

  it('hides far items on long lists', () => {
    expect(placementFor(2, long, 100).opacity).toBe(1);
    expect(placementFor(6, long, 100).visible).toBe(false);
    expect(placementFor(6, long, 100).opacity).toBe(0);
  });
});

describe('settlePosition', () => {
  it('settles on the nearest item when released slowly', () => {
    expect(settlePosition(2.4, 0, four)).toBe(2);
  });

  it('carries a quick flick a little further', () => {
    expect(settlePosition(2.4, 0.01, four)).toBe(4);
  });

  it('never settles past the ends of long lists', () => {
    expect(settlePosition(56.8, 0.05, long)).toBe(57);
  });
});
