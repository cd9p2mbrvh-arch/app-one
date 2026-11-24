import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Glow } from './Glow';
import { useLoop, useOscillator, type SceneProps } from './motion';

/**
 * Noon: a sunset at the beach. The sun sinks into a warm sea, its reflection
 * shimmers on the water, waves roll in and the foam washes up the sand.
 */
export function BeachSunsetScene({ width, height, still }: SceneProps) {
  const horizon = height * 0.56;
  const shore = height * 0.84;
  const sunR = width * 0.2;
  const sunX = width * 0.5;

  const glow = useOscillator(6000, still);
  const sink = useOscillator(20000, still);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Sun glow and disc, half below the horizon, bobbing very slowly */}
      <Animated.View
        style={{
          position: 'absolute',
          left: sunX - sunR * 3,
          top: horizon - sunR * 3,
          transform: [
            { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.1] }) },
          ],
        }}
      >
        <Glow id="sunsetGlow" size={sunR * 6} color="#FFE7A0" />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          left: sunX - sunR,
          top: horizon - sunR * 0.75,
          transform: [
            { translateY: sink.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] }) },
          ],
        }}
      >
        <Svg width={sunR * 2} height={sunR * 2}>
          <Defs>
            <LinearGradient id="sunsetDisc" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFF3C4" />
              <Stop offset="1" stopColor="#FFC97A" />
            </LinearGradient>
          </Defs>
          <Ellipse cx={sunR} cy={sunR} rx={sunR} ry={sunR} fill="url(#sunsetDisc)" />
        </Svg>
      </Animated.View>

      {/* Sea (covers the lower half of the sun) */}
      <Svg
        width={width}
        height={height - horizon}
        style={{ position: 'absolute', top: horizon, left: 0 }}
      >
        <Defs>
          <LinearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F7A184" />
            <Stop offset="1" stopColor="#E58C98" />
          </LinearGradient>
          <LinearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F6CFA6" />
            <Stop offset="1" stopColor="#F3C59A" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height - horizon} fill="url(#sea)" />
        <Rect x={0} y={shore - horizon} width={width} height={height - shore} fill="url(#sand)" />
      </Svg>

      <Reflection x={sunX} top={horizon} width={width} still={still} />
      <RollingSwell top={horizon + (shore - horizon) * 0.45} width={width} still={still} />
      <Foam top={shore} width={width} still={still} />
    </View>
  );
}

/** Shimmering streaks of sunlight on the water below the sun. */
function Reflection({
  x,
  top,
  width,
  still,
}: {
  x: number;
  top: number;
  width: number;
  still: boolean;
}) {
  const streaks = [0, 1, 2, 3, 4, 5];
  return (
    <>
      {streaks.map((i) => (
        <Streak
          key={i}
          index={i}
          x={x}
          y={top + 10 + i * 22}
          w={width * (0.34 - i * 0.04)}
          still={still}
        />
      ))}
    </>
  );
}

function Streak({
  index,
  x,
  y,
  w,
  still,
}: {
  index: number;
  x: number;
  y: number;
  w: number;
  still: boolean;
}) {
  const shimmer = useOscillator(1400 + index * 260, still, index * 180);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y,
        width: w,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFF1C0',
        opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] }),
        transform: [
          { scaleX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) },
        ],
      }}
    />
  );
}

/** A long soft swell rolling sideways across the sea. */
function RollingSwell({ top, width, still }: { top: number; width: number; still: boolean }) {
  const wavelength = width * 0.9;
  const periods = 3;
  const w = wavelength * periods;
  const amp = 10;
  const roll = useLoop(14000, still);
  let d = `M 0 ${amp}`;
  for (let i = 0; i < periods; i++) {
    const x0 = i * wavelength;
    d += ` Q ${x0 + wavelength / 4} 0, ${x0 + wavelength / 2} ${amp} T ${x0 + wavelength} ${amp}`;
  }
  d += ` L ${w} ${amp * 4} L 0 ${amp * 4} Z`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left: 0,
        opacity: 0.45,
        transform: [
          { translateX: roll.interpolate({ inputRange: [0, 1], outputRange: [0, -wavelength] }) },
        ],
      }}
    >
      <Svg width={w} height={amp * 4}>
        <Path d={d} fill="#FFD3B5" />
      </Svg>
    </Animated.View>
  );
}

/** Foam washing up the sand and sliding back. */
function Foam({ top, width, still }: { top: number; width: number; still: boolean }) {
  const wash = useOscillator(3800, still);
  const w = width * 1.2;
  const d = `M 0 14 C ${w * 0.2} 0, ${w * 0.35} 22, ${w * 0.55} 10 S ${w * 0.85} 0, ${w} 14 L ${w} 30 L 0 30 Z`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: top - 16,
        left: -width * 0.1,
        opacity: wash.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.35, 0.9, 0.5] }),
        transform: [
          { translateY: wash.interpolate({ inputRange: [0, 1], outputRange: [-6, 16] }) },
        ],
      }}
    >
      <Svg width={w} height={30}>
        <Path d={d} fill="#FFFFFF" />
      </Svg>
    </Animated.View>
  );
}
