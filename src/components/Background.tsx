import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

/**
 * Full-screen soft gradient for the current time of day: a vertical base gradient
 * with large radial "blobs" that fade to transparent, giving a blurred look
 * without a costly blur filter.
 */
export function Background() {
  const { backdrop, period } = useTheme();
  const { width, height } = useWindowDimensions();
  const size = Math.max(width, height);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={`background-${period}`}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="base" x1="0" y1="0" x2="0" y2="1">
            {backdrop.gradient.map((color, i) => (
              <Stop key={i} offset={i / (backdrop.gradient.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
          {backdrop.blobs.map((blob, i) => (
            <RadialGradient key={i} id={`blob${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={blob.color} stopOpacity={0.9} />
              <Stop offset="0.6" stopColor={blob.color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x="0" y="0" width={width} height={height} fill="url(#base)" />
        {backdrop.blobs.map((blob, i) => (
          <Circle
            key={i}
            cx={blob.cx * width}
            cy={blob.cy * height}
            r={blob.r * size}
            fill={`url(#blob${i})`}
          />
        ))}
      </Svg>
    </View>
  );
}
