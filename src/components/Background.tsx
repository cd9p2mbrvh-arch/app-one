import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Circle,
  Stop,
} from 'react-native-svg';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, type Blob, type Wave } from '@/theme';

/**
 * Full-screen background for the current time of day: a base gradient, soft
 * colour spots that drift slowly, and waves rolling sideways — all behind a
 * frosted-glass blur. Motion uses the native driver (transforms only), so it runs
 * off the JavaScript thread, and stops when the system "Reduce Motion" is on.
 */
export function Background() {
  const { backdrop, period } = useTheme();
  const { width, height } = useWindowDimensions();
  const still = useReduceMotion();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={`background-${period}`}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2="0" y2="1">
            {backdrop.gradient.map((color, i) => (
              <Stop key={i} offset={i / (backdrop.gradient.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#base)" />
      </Svg>

      {backdrop.blobs.map((blob, i) => (
        <DriftingBlob
          key={`${period}-blob-${i}`}
          blob={blob}
          index={i}
          screen={{ width, height }}
          still={still}
        />
      ))}
      {backdrop.waves.map((wave, i) => (
        <RollingWave
          key={`${period}-wave-${i}`}
          wave={wave}
          index={i}
          screen={{ width, height }}
          still={still}
        />
      ))}

      <BlurView
        intensity={backdrop.glass === 'dark' ? 30 : 40}
        tint={backdrop.glass}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

type Screen = { width: number; height: number };

/** A looping 0 → 1 → 0 value with a smooth sine-like ease. */
function useOscillator(durationMs: number, still: boolean) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (still) {
      value.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration: durationMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [value, durationMs, still]);
  return value;
}

function DriftingBlob({
  blob,
  index,
  screen,
  still,
}: {
  blob: Blob;
  index: number;
  screen: Screen;
  still: boolean;
}) {
  const size = Math.max(screen.width, screen.height) * blob.r * 2;
  // Different, slow periods per blob so the movement never visibly repeats.
  const a = useOscillator(19000 + index * 7000, still);
  const b = useOscillator(23000 + index * 5000, still);
  const drift = screen.width * 0.12;
  const id = `blob-${index}`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: blob.cx * screen.width - size / 2,
        top: blob.cy * screen.height - size / 2,
        width: size,
        height: size,
        transform: [
          { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [-drift, drift] }) },
          { translateY: b.interpolate({ inputRange: [0, 1], outputRange: [drift, -drift] }) },
          { scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.1] }) },
        ],
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={blob.color} stopOpacity={0.9} />
            <Stop offset="0.6" stopColor={blob.color} stopOpacity={0.35} />
            <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Smooth periodic wave path: `periods` full waves across `width`, filled downwards. */
export function wavePath(width: number, height: number, amplitude: number, periods: number) {
  const wavelength = width / periods;
  let d = `M 0 ${amplitude}`;
  for (let i = 0; i < periods; i++) {
    const x0 = i * wavelength;
    d += ` C ${x0 + wavelength * 0.25} ${-amplitude * 0.3}, ${x0 + wavelength * 0.25} ${-amplitude * 0.3}, ${x0 + wavelength / 2} ${amplitude}`;
    d += ` C ${x0 + wavelength * 0.75} ${amplitude * 2.3}, ${x0 + wavelength * 0.75} ${amplitude * 2.3}, ${x0 + wavelength} ${amplitude}`;
  }
  return `${d} L ${width} ${height} L 0 ${height} Z`;
}

function RollingWave({
  wave,
  index,
  screen,
  still,
}: {
  wave: Wave;
  index: number;
  screen: Screen;
  still: boolean;
}) {
  const wavelength = screen.width * 1.2;
  const periods = 3;
  const width = wavelength * periods;
  const height = screen.height * (1 - wave.y) + 80;
  const amplitude = 26 + index * 10;
  // Sideways roll: moving exactly one wavelength makes the loop seamless.
  const [roll] = useState(() => new Animated.Value(0));
  const bob = useOscillator(9000 + index * 3000, still);

  useEffect(() => {
    if (still) return;
    roll.setValue(0);
    const loop = Animated.loop(
      Animated.timing(roll, {
        toValue: 1,
        duration: 26000 + index * 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [roll, index, still]);

  const direction = index % 2 === 0 ? -1 : 1;
  const id = `wave-${index}`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: screen.height * wave.y,
        left: direction < 0 ? 0 : -wavelength,
        width,
        height,
        opacity: wave.opacity,
        transform: [
          {
            translateX: roll.interpolate({
              inputRange: [0, 1],
              outputRange: [0, direction * wavelength],
            }),
          },
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] }) },
        ],
      }}
    >
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={wave.color} stopOpacity={1} />
            <Stop offset="1" stopColor={wave.color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={wavePath(width, height, amplitude, periods)} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
