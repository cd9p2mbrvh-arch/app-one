import { Animated } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

/** Night: a star streaking across the upper sky. */
export function ShootingStar({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(1100, onDone);
  const length = width * 0.28;
  const startX = width * (0.02 + variant * 0.3);
  const startY = topInset + height * (0.08 + variant * 0.15);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
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
