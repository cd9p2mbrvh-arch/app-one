import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useOscillator } from '../motion';
import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

/** One bird's wings, drawn as a soft "m" shape. */
function wing(size: number) {
  const w = 24 * size;
  const h = 10 * size;
  return {
    w,
    h,
    d: `M 1 ${h * 0.75} Q ${w * 0.25} ${h * 0.05}, ${w / 2} ${h * 0.7} Q ${w * 0.75} ${h * 0.05}, ${w - 1} ${h * 0.75}`,
  };
}

/**
 * A single bird. Each one flaps at its own pace and starting point, and bobs
 * gently on its own, so the flock looks alive rather than moving in lockstep.
 */
function Bird({
  size,
  x,
  y,
  flapMs,
  phaseMs,
  color,
  strokeWidth,
}: {
  size: number;
  x: number;
  y: number;
  flapMs: number;
  phaseMs: number;
  color: string;
  strokeWidth: number;
}) {
  const flap = useOscillator(flapMs, false, phaseMs);
  const bob = useOscillator(flapMs * 3.2, false, phaseMs);
  const { w, h, d } = wing(size);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: [
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-3, 3] }) },
          // Wings beat by squashing vertically; never fully flat, so it stays soft.
          { scaleY: flap.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }) },
        ],
      }}
    >
      <Svg width={w} height={h}>
        <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

const FLOCK = [
  { x: 0, y: 14, size: 1.3, flapMs: 300, phaseMs: 0 },
  { x: 30, y: 0, size: 1.05, flapMs: 340, phaseMs: 120 },
  { x: 36, y: 28, size: 1.1, flapMs: 320, phaseMs: 260 },
  { x: 64, y: 10, size: 0.9, flapMs: 360, phaseMs: 60 },
];

/** Morning: a small flock flying across on a gentle, curved path. */
export function Birds({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(12000, onDone, Easing.inOut(Easing.sin));
  const leftToRight = variant < 0.5;
  const y = topInset + height * (0.12 + variant * 0.25);
  const w = 100;
  const h = 46;
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
          {
            // A smooth rise and dip, sampled densely so there are no corners.
            translateY: t.interpolate({
              inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
              outputRange: [0, -10, -18, -14, -4, 2],
            }),
          },
          { scaleX: leftToRight ? 1 : -1 },
        ],
      }}
    >
      {FLOCK.map((b, i) => (
        <Bird key={i} {...b} color="#3E5568" strokeWidth={2.6} />
      ))}
    </Animated.View>
  );
}

/**
 * Noon: a seagull gliding over the beach — a few slow wing beats, then a long
 * glide on outstretched wings.
 */
export function Seagull({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(11000, onDone);
  const leftToRight = variant < 0.5;
  const y = topInset + height * (0.1 + variant * 0.25);
  const w = 70;
  const h = 28;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: w,
        height: h,
        opacity: t.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 0.65, 0.65, 0] }),
        transform: [
          {
            translateX: t.interpolate({
              inputRange: [0, 1],
              outputRange: leftToRight ? [-w, width] : [width, -w],
            }),
          },
          {
            translateY: t.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [0, -10, -4, 6, -2],
            }),
          },
          { scaleX: leftToRight ? 1 : -1 },
        ],
      }}
    >
      <Animated.View
        style={{
          transform: [
            {
              // Beats during the first part of each stretch, then glides (wings open).
              scaleY: t.interpolate({
                inputRange: [0, 0.04, 0.08, 0.12, 0.16, 0.5, 0.54, 0.58, 0.62, 1],
                outputRange: [1, 0.55, 1, 0.55, 1, 1, 0.6, 1, 0.6, 1],
              }),
            },
          ],
        }}
      >
        <Svg width={w} height={h}>
          <Path
            d="M 3 16 Q 18 3, 35 17 Q 52 3, 67 16"
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
