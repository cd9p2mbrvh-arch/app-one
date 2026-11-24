import { Animated, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { Glow } from './Glow';
import { seededRandom, useLoop, useOccasional, useOscillator, type SceneProps } from './motion';

/**
 * Night: the moon with a soft halo, stars twinkling in three rhythms, thin
 * clouds drifting past and an occasional shooting star.
 */
export function NightSkyScene({ width, height, still, topInset = 0 }: SceneProps) {
  // In the empty part of the header (between the level bar and the switch icon),
  // so it never sits behind text.
  const moonR = Math.min(width * 0.065, 24);
  const moonX = width * 0.82;
  const moonY = topInset + 46;
  const halo = useOscillator(7000, still);

  return (
    <View style={StyleSheet.absoluteFill}>
      <StarField width={width} height={height} still={still} topInset={topInset} />

      <Animated.View
        style={{
          position: 'absolute',
          left: moonX - moonR * 5,
          top: moonY - moonR * 5,
          transform: [
            { scale: halo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) },
          ],
        }}
      >
        <Glow id="moonHalo" size={moonR * 10} color="#A9BFEA" core={0.55} />
      </Animated.View>
      <Svg
        width={moonR * 2}
        height={moonR * 2}
        style={{ position: 'absolute', left: moonX - moonR, top: moonY - moonR }}
      >
        <Defs>
          <RadialGradient id="moonDisc" cx="40%" cy="35%" r="65%">
            <Stop offset="0" stopColor="#F4F7FD" />
            <Stop offset="1" stopColor="#C9D4EA" />
          </RadialGradient>
        </Defs>
        <Circle cx={moonR} cy={moonR} r={moonR} fill="url(#moonDisc)" />
        <G fill="#AEBBD6" opacity={0.45}>
          <Circle cx={moonR * 0.65} cy={moonR * 0.8} r={moonR * 0.18} />
          <Circle cx={moonR * 1.3} cy={moonR * 1.25} r={moonR * 0.24} />
          <Circle cx={moonR * 1.15} cy={moonR * 0.55} r={moonR * 0.1} />
        </G>
      </Svg>

      <NightClouds width={width} height={height} still={still} topInset={topInset} />
      <ShootingStar width={width} height={height} still={still} topInset={topInset} />
    </View>
  );
}

/** Stars in three groups that twinkle at different rhythms. */
function StarField({ width, height, still }: SceneProps) {
  const random = seededRandom(42);
  const groups = [0, 1, 2].map(() =>
    Array.from({ length: 16 }, () => ({
      x: random() * width,
      // Denser towards the top of the sky.
      y: Math.pow(random(), 1.6) * height * 0.85,
      r: 0.8 + random() * 1.6,
    })),
  );
  return (
    <>
      {groups.map((stars, i) => (
        <StarGroup key={i} index={i} stars={stars} width={width} height={height} still={still} />
      ))}
    </>
  );
}

function StarGroup({
  index,
  stars,
  width,
  height,
  still,
}: SceneProps & { index: number; stars: { x: number; y: number; r: number }[] }) {
  const twinkle = useOscillator(1800 + index * 900, still, index * 600);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
      }}
    >
      <Svg width={width} height={height}>
        {stars.map((s, i) => (
          <G key={i}>
            <Circle cx={s.x} cy={s.y} r={s.r * 3} fill="#DDE6FF" opacity={0.18} />
            <Circle cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" />
          </G>
        ))}
      </Svg>
    </Animated.View>
  );
}

function NightClouds({ width, height, still }: SceneProps) {
  const clouds = [
    { y: 0.3, speed: 90000, delay: 0, scale: 1.1 },
    { y: 0.62, speed: 110000, delay: 40000, scale: 1.4 },
  ];
  return (
    <>
      {clouds.map((c, i) => (
        <NightCloud key={i} index={i} {...c} width={width} height={height} still={still} />
      ))}
    </>
  );
}

function NightCloud({
  index,
  y,
  speed,
  delay,
  scale,
  width,
  height,
  still,
}: SceneProps & { index: number; y: number; speed: number; delay: number; scale: number }) {
  const w = width * 0.8 * scale;
  const h = w * 0.3;
  const drift = useLoop(speed, still, delay);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: height * y,
        left: 0,
        opacity: 0.55,
        transform: [
          { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [width, -w] }) },
        ],
      }}
    >
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id={`ncloud${index}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#2E4C85" stopOpacity={1} />
            <Stop offset="1" stopColor="#2E4C85" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <G fill={`url(#ncloud${index})`}>
          <Ellipse cx={w * 0.4} cy={h * 0.55} rx={w * 0.38} ry={h * 0.42} />
          <Ellipse cx={w * 0.65} cy={h * 0.5} rx={w * 0.32} ry={h * 0.4} />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Every so often a star streaks across the upper sky. */
function ShootingStar({ width, height, still }: SceneProps) {
  const t = useOccasional(1100, 9000, still);
  const length = width * 0.28;
  if (still) return null;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: width * 0.05,
        top: height * 0.12,
        width: length,
        height: 3,
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 0.8, 0] }),
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, width * 0.55] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.16] }) },
          { rotate: '16deg' },
        ],
      }}
    >
      <Svg width={length} height={3}>
        <Defs>
          <LinearGradient id="trail" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={length} height={3} rx={1.5} fill="url(#trail)" />
      </Svg>
    </Animated.View>
  );
}
