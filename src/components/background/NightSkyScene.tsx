import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { Glow } from './Glow';
import { SceneEvents, ShootingStar, Ufo } from './events';
import { seededRandom, useLoop, useOscillator, type SceneProps } from './motion';

const NIGHT_EVENTS = { ufo: Ufo, shootingStar: ShootingStar };

/**
 * Night: the moon with a soft halo, shimmering stars with a few sparkles, thin
 * clouds drifting past, and now and then a shooting star or a UFO.
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
      <SceneEvents
        events={NIGHT_EVENTS}
        width={width}
        height={height}
        topInset={topInset}
        still={still}
      />
    </View>
  );
}

/** Stars in four groups that shimmer at different rhythms, plus a few sparkles. */
function StarField({ width, height, still }: SceneProps) {
  const random = seededRandom(42);
  const groups = [0, 1, 2, 3].map(() =>
    Array.from({ length: 13 }, () => ({
      x: random() * width,
      // Denser towards the top of the sky.
      y: Math.pow(random(), 1.6) * height * 0.85,
      r: 0.8 + random() * 1.6,
    })),
  );
  const sparkles = Array.from({ length: 6 }, () => ({
    x: random() * width,
    y: Math.pow(random(), 1.4) * height * 0.75,
    size: 14 + random() * 10,
  }));
  return (
    <>
      {groups.map((stars, i) => (
        <StarGroup key={i} index={i} stars={stars} width={width} height={height} still={still} />
      ))}
      {sparkles.map((s, i) => (
        <Sparkle key={i} index={i} {...s} still={still} />
      ))}
    </>
  );
}

/** A brighter star with a four-point glint that pulses and turns slightly. */
function Sparkle({
  index,
  x,
  y,
  size,
  still,
}: {
  index: number;
  x: number;
  y: number;
  size: number;
  still: boolean;
}) {
  const pulse = useOscillator(1100 + index * 370, still, index * 450);
  const c = size / 2;
  const arm = size / 2;
  const waist = size * 0.09;
  const d = `M ${c} ${c - arm} L ${c + waist} ${c - waist} L ${c + arm} ${c} L ${c + waist} ${c + waist} L ${c} ${c + arm} L ${c - waist} ${c + waist} L ${c - arm} ${c} L ${c - waist} ${c - waist} Z`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - c,
        top: y - c,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }),
        transform: [
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
          { rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '20deg'] }) },
        ],
      }}
    >
      <Svg width={size} height={size}>
        <Path d={d} fill="#FFFFFF" />
        <Circle cx={c} cy={c} r={size * 0.12} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}

function StarGroup({
  index,
  stars,
  width,
  height,
  still,
}: SceneProps & { index: number; stars: { x: number; y: number; r: number }[] }) {
  const twinkle = useOscillator(900 + index * 550, still, index * 400);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        opacity: twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }),
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
