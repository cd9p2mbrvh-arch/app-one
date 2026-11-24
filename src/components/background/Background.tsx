import { BlurView } from 'expo-blur';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme, type TimeOfDay } from '@/theme';

import { BeachSunsetScene } from './BeachSunsetScene';
import type { SceneProps } from './motion';
import { NightSkyScene } from './NightSkyScene';
import { SunriseScene } from './SunriseScene';

const SCENES: Record<TimeOfDay, (props: SceneProps) => React.ReactNode> = {
  morning: SunriseScene,
  noon: BeachSunsetScene,
  night: NightSkyScene,
};

/** Frosted-glass strength over each scene (1–100): enough to soften, not hide. */
export const GLASS_INTENSITY: Record<TimeOfDay, number> = {
  morning: 18,
  noon: 16,
  night: 10,
};

/**
 * Full-screen animated scene for the current time of day — morning sunrise,
 * sunset at the beach, or moon and stars — behind a frosted-glass blur.
 * Motion stops when the system Reduce Motion setting is on.
 */
export function Background({ topInset = 0 }: { topInset?: number }) {
  const { backdrop, period } = useTheme();
  const { width, height } = useWindowDimensions();
  const still = useReduceMotion();
  const Scene = SCENES[period];

  return (
    // overflow: hidden — scene details (sun rays, clouds) extend past the edges and
    // must never make the screen wider (on the web that zooms the whole page out).
    <View
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
      pointerEvents="none"
      testID={`background-${period}`}
    >
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            {backdrop.gradient.map((color, i) => (
              <Stop key={i} offset={i / (backdrop.gradient.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#sky)" />
      </Svg>

      <Scene key={period} width={width} height={height} still={still} topInset={topInset} />

      <BlurView
        intensity={GLASS_INTENSITY[period]}
        tint={backdrop.glass}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
