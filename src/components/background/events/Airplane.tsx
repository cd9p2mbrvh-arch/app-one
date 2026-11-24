import { Animated } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

/** The plane is drawn at 44 × 16 and scaled up so it reads under the blur. */
const SCALE = 1.7;
const PLANE_W = 44 * SCALE;
const PLANE_H = 16 * SCALE;
const TRAIL_W = 200;

/** Morning: a small airplane crossing the sky, leaving a fading contrail. */
export function Airplane({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(9000, onDone);
  const leftToRight = variant < 0.5;
  const y = topInset + height * (0.08 + variant * 0.3);
  const totalW = PLANE_W + TRAIL_W;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: totalW,
        height: PLANE_H,
        opacity: t.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          {
            translateX: t.interpolate({
              inputRange: [0, 1],
              outputRange: leftToRight ? [-totalW, width] : [width, -totalW],
            }),
          },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [6, -10] }) },
          { scaleX: leftToRight ? 1 : -1 },
        ],
      }}
    >
      <Svg width={totalW} height={PLANE_H}>
        <Defs>
          <LinearGradient id="contrail" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.75} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={PLANE_H / 2 - 1.5}
          width={TRAIL_W}
          height={3}
          rx={1.5}
          fill="url(#contrail)"
        />
        {/* Side view of a small airliner, pointing right */}
        <Path
          transform={`translate(${TRAIL_W} 0) scale(${SCALE})`}
          d="M2 8 C2 6.5 4 6 7 6 L33 6 C38 6 42 7 43.5 8 C42 9 38 10 33 10 L7 10 C4 10 2 9.5 2 8 Z M14 6 L22 0.5 L26 0.5 L21 6 Z M15 10 L23 15.5 L27 15.5 L21 10 Z M3 6.5 L1 1.5 L4.5 1.5 L8 6 Z"
          fill="#8C9DB2"
        />
      </Svg>
    </Animated.View>
  );
}
