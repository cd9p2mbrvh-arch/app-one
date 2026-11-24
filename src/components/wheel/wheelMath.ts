/**
 * Geometry for the rotary wheel. Positions are measured in "items": position 2.5
 * means halfway between item 2 and item 3 being at the top of the wheel.
 *
 * Small lists (≤ 12 items) are spread evenly around the full circle and wrap
 * around endlessly. Long lists (like 58 durations) use a fixed angle per item,
 * stop at the ends, and fade out items far from the top.
 */
export type WheelGeometry = { count: number; wrap: boolean; stepDeg: number };

export const MAX_WRAPPED_ITEMS = 12;
export const LONG_LIST_STEP_DEG = 24;
/** Items further than this from the top are hidden on long lists. */
export const LONG_LIST_VISIBLE_DEG = 150;

export function geometryFor(count: number): WheelGeometry {
  if (count <= MAX_WRAPPED_ITEMS) {
    return { count, wrap: true, stepDeg: 360 / Math.max(count, 1) };
  }
  return { count, wrap: false, stepDeg: LONG_LIST_STEP_DEG };
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/** Clamps a position for lists that do not wrap. */
export function clampPosition(pos: number, g: WheelGeometry): number {
  if (g.wrap) return pos;
  return Math.min(Math.max(pos, 0), g.count - 1);
}

/** The item index currently nearest the top. */
export function indexAt(pos: number, g: WheelGeometry): number {
  const i = Math.round(pos);
  return g.wrap ? mod(i, g.count) : Math.min(Math.max(i, 0), g.count - 1);
}

/** How many steps item `i` is from the top: negative = left, positive = right. */
export function offsetOf(i: number, pos: number, g: WheelGeometry): number {
  if (!g.wrap) return i - pos;
  const n = g.count;
  return mod(i - pos + n / 2, n) - n / 2;
}

/** The position to rotate to so item `i` reaches the top the short way round. */
export function positionFor(i: number, fromPos: number, g: WheelGeometry): number {
  return fromPos + offsetOf(i, fromPos, g);
}

/** Signed smallest difference between two angles in degrees, in (-180, 180]. */
export function angleDelta(from: number, to: number): number {
  const d = mod(to - from + 180, 360) - 180;
  return d === -180 ? 180 : d;
}

/** Angle of a point around a centre, 0° at the top, growing clockwise. */
export function pointerAngle(x: number, y: number, cx: number, cy: number): number {
  return (Math.atan2(x - cx, cy - y) * 180) / Math.PI;
}

export type Placement = {
  /** Offset from the wheel centre, in pixels. */
  x: number;
  y: number;
  /** 1 at the top, falling to 0 one step away. */
  emphasis: number;
  opacity: number;
  visible: boolean;
};

export function placementFor(offset: number, g: WheelGeometry, radius: number): Placement {
  const deg = offset * g.stepDeg;
  const rad = (deg * Math.PI) / 180;
  const far = Math.abs(deg);
  const visible = g.wrap || far <= LONG_LIST_VISIBLE_DEG;
  const opacity = g.wrap
    ? 1
    : Math.max(0, 1 - Math.max(0, far - 60) / (LONG_LIST_VISIBLE_DEG - 60));
  return {
    x: radius * Math.sin(rad),
    y: -radius * Math.cos(rad),
    emphasis: Math.max(0, 1 - Math.abs(offset)),
    opacity: visible ? opacity : 0,
    visible,
  };
}

/**
 * Where to settle after the finger lifts: the nearest item, nudged in the
 * direction of a quick flick. `velocity` is in items per millisecond.
 */
export function settlePosition(pos: number, velocity: number, g: WheelGeometry): number {
  const projected = pos + velocity * 120;
  return clampPosition(Math.round(projected), g);
}
