import { Animated } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

/** The fish is drawn at 36 × 16 and scaled up so it reads under the blur. */
const SCALE = 1.6;
const FISH_W = 36 * SCALE;
const FISH_H = 16 * SCALE;

/**
 * Noon: a fish leaps out of the sea in an arc and dives back in, with a
 * splash ring where it leaves the water and where it lands.
 */
export function FishJump({ width, height, variant, onDone }: EventProps) {
  const t = useEventProgress(2200, onDone);
  // Same layout as the beach scene: sea between 56% and 84% of the height.
  const water = height * (0.62 + variant * 0.12);
  const startX = width * (0.15 + variant * 0.45);
  const span = width * 0.28;
  const leap = height * 0.13;
  const leftToRight = variant < 0.5;
  const dir = leftToRight ? 1 : -1;

  return (
    <>
      <Splash x={startX} y={water} t={t} at={0.15} />
      <Splash x={startX + dir * span} y={water} t={t} at={0.75} />
      <Animated.View
        style={{
          position: 'absolute',
          left: startX - FISH_W / 2,
          top: water - FISH_H / 2,
          width: FISH_W,
          height: FISH_H,
          opacity: t.interpolate({
            inputRange: [0, 0.15, 0.2, 0.72, 0.78, 1],
            outputRange: [0, 0, 1, 1, 0, 0],
          }),
          transform: [
            {
              translateX: t.interpolate({
                inputRange: [0.15, 0.78],
                outputRange: [0, dir * span],
                extrapolate: 'clamp',
              }),
            },
            {
              // A parabola sampled at a few points.
              translateY: t.interpolate({
                inputRange: [0.15, 0.3, 0.46, 0.62, 0.78],
                outputRange: [0, -leap * 0.75, -leap, -leap * 0.75, 0],
                extrapolate: 'clamp',
              }),
            },
            {
              rotate: t.interpolate({
                inputRange: [0.15, 0.78],
                outputRange: leftToRight ? ['-40deg', '45deg'] : ['40deg', '-45deg'],
                extrapolate: 'clamp',
              }),
            },
            { scaleX: dir },
          ],
        }}
      >
        <Svg width={FISH_W} height={FISH_H}>
          <Path
            transform={`scale(${SCALE})`}
            d="M 3 8 C 8 1, 22 1, 28 8 C 22 15, 8 15, 3 8 Z M 27 8 L 35 2 L 33 8 L 35 14 Z"
            fill="#8E3F55"
          />
        </Svg>
      </Animated.View>
    </>
  );
}

function Splash({ x, y, t, at }: { x: number; y: number; t: Animated.Value; at: number }) {
  const w = 64;
  const h = 16;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity: t.interpolate({
          inputRange: [at - 0.02, at, at + 0.2],
          outputRange: [0, 0.9, 0],
          extrapolate: 'clamp',
        }),
        transform: [
          {
            scale: t.interpolate({
              inputRange: [at, at + 0.2],
              outputRange: [0.4, 1.4],
              extrapolate: 'clamp',
            }),
          },
        ],
      }}
    >
      <Svg width={w} height={h}>
        <Ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - 2}
          ry={h / 2 - 2}
          stroke="#FFFFFF"
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}
