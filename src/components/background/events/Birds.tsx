import { Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useOscillator } from '../motion';
import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

const FLOCK = [
  { x: 0, y: 14, s: 1.3 },
  { x: 30, y: 0, s: 1.05 },
  { x: 34, y: 26, s: 1.1 },
  { x: 62, y: 10, s: 0.9 },
];

/** A small flock of birds flapping across the sky. */
export function Birds({
  width,
  height,
  topInset,
  variant,
  onDone,
  color = '#3E5568',
}: EventProps & { color?: string }) {
  const t = useEventProgress(11000, onDone);
  const flap = useOscillator(260, false);
  const leftToRight = variant < 0.5;
  const y = topInset + height * (0.12 + variant * 0.25);
  const w = 104;
  const h = 44;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: w,
        height: h,
        opacity: t.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.7, 0.7, 0] }),
        transform: [
          {
            translateX: t.interpolate({
              inputRange: [0, 1],
              outputRange: leftToRight ? [-w, width] : [width, -w],
            }),
          },
          { translateY: t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -18, 4] }) },
          { scaleX: leftToRight ? 1 : -1 },
        ],
      }}
    >
      <Animated.View
        style={{
          transform: [{ scaleY: flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }],
        }}
      >
        <Svg width={w} height={h}>
          {FLOCK.map((b, i) => (
            <Path
              key={i}
              d={`M ${b.x} ${b.y + 6 * b.s} Q ${b.x + 6 * b.s} ${b.y}, ${b.x + 12 * b.s} ${b.y + 6 * b.s} Q ${b.x + 18 * b.s} ${b.y}, ${b.x + 24 * b.s} ${b.y + 6 * b.s}`}
              stroke={color}
              strokeWidth={2.6}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

/** Noon: a single seagull gliding over the beach (same drawing, larger, one bird). */
export function Seagull({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(10000, onDone);
  const flap = useOscillator(700, false);
  const leftToRight = variant < 0.5;
  const y = topInset + height * (0.1 + variant * 0.25);
  const w = 70;
  const h = 26;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: w,
        height: h,
        opacity: t.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.65, 0.65, 0] }),
        transform: [
          {
            translateX: t.interpolate({
              inputRange: [0, 1],
              outputRange: leftToRight ? [-w, width] : [width, -w],
            }),
          },
          {
            translateY: t.interpolate({
              inputRange: [0, 0.3, 0.6, 1],
              outputRange: [0, -12, 6, -8],
            }),
          },
        ],
      }}
    >
      <Animated.View
        style={{
          transform: [{ scaleY: flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }) }],
        }}
      >
        <Svg width={w} height={h}>
          <Path
            d="M 3 15 Q 18 2, 35 16 Q 52 2, 67 15"
            stroke="#5E3018"
            strokeWidth={3.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
