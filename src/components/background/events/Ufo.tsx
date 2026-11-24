import { Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { Glow } from '../Glow';
import { useOscillator } from '../motion';
import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

const W = 56;
const H = 30;
const LIGHTS = [10, 20, 28, 36, 46];

/** Night: a little UFO wobbling across the sky with blinking lights. */
export function Ufo({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(9000, onDone);
  const wobble = useOscillator(900, false);
  const blink = useOscillator(350, false);
  const leftToRight = variant < 0.5;
  const y = topInset + height * (0.18 + variant * 0.3);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: 0,
        width: W,
        height: H + 24,
        opacity: t.interpolate({ inputRange: [0, 0.08, 0.9, 1], outputRange: [0, 0.9, 0.9, 0] }),
        transform: [
          {
            translateX: t.interpolate({
              // A pause in the middle, as if it is looking around.
              inputRange: [0, 0.4, 0.55, 1],
              outputRange: leftToRight
                ? [-W, width * 0.45, width * 0.5, width]
                : [width, width * 0.5, width * 0.45, -W],
            }),
          },
          { translateY: wobble.interpolate({ inputRange: [0, 1], outputRange: [-5, 5] }) },
          { rotate: wobble.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '6deg'] }) },
        ],
      }}
    >
      <View style={{ position: 'absolute', left: W / 2 - 30, top: H - 14 }}>
        <Glow id="ufoGlow" size={60} color="#9FE8C8" core={0.5} />
      </View>
      <Svg width={W} height={H}>
        <Path d={`M 18 14 C 18 4, 38 4, 38 14 Z`} fill="#CFE0FF" opacity={0.85} />
        <Ellipse cx={W / 2} cy={17} rx={W / 2 - 1} ry={7} fill="#A9B6D1" />
        <Ellipse cx={W / 2} cy={15} rx={W / 2 - 6} ry={3} fill="#C9D3E8" />
      </Svg>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: blink.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
        }}
      >
        <Svg width={W} height={H}>
          {LIGHTS.map((x, i) => (
            <Circle key={x} cx={x} cy={19} r={1.8} fill={i % 2 ? '#FFE27A' : '#8FF0D2'} />
          ))}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
