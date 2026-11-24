import { Animated, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { Glow } from '../Glow';
import { useOscillator } from '../motion';
import type { EventProps } from './SceneEvents';
import { useEventProgress } from './useEventProgress';

const W = 56;
const H = 30;
const LIGHTS = [10, 20, 28, 36, 46];

/** Phases of the UFO's visit, as fractions of its total time. */
const APPEAR_END = 0.18;
const HOVER_END = 0.62;

/**
 * Night: a UFO fades in at one spot, hovers there for a moment with blinking
 * lights, then accelerates away fast and shrinks into the distance.
 */
export function Ufo({ width, height, topInset, variant, onDone }: EventProps) {
  const t = useEventProgress(6000, onDone);
  const wobble = useOscillator(900, false);
  const blink = useOscillator(350, false);

  const x = width * (0.2 + variant * 0.5) - W / 2;
  const y = topInset + height * (0.18 + variant * 0.25);
  const awayRight = variant < 0.5;
  // Far enough to leave the screen whichever way it goes.
  const dx = (awayRight ? 1 : -1) * width * 1.2;
  const dy = -height * 0.25;
  // Accelerating: position grows with the square of time after the hover.
  const away = [0, 0.04, 0.16, 0.36, 0.64, 1];
  const awayInput = away.map((_, i) => HOVER_END + ((1 - HOVER_END) * i) / (away.length - 1));

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: y,
        left: x,
        width: W,
        height: H + 24,
        opacity: t.interpolate({
          inputRange: [0, APPEAR_END, 0.9, 1],
          outputRange: [0, 0.95, 0.95, 0],
        }),
        transform: [
          {
            translateX: t.interpolate({
              inputRange: [0, ...awayInput],
              outputRange: [0, ...away.map((f) => f * dx)],
            }),
          },
          {
            translateY: t.interpolate({
              inputRange: [0, ...awayInput],
              outputRange: [0, ...away.map((f) => f * dy)],
            }),
          },
          {
            scale: t.interpolate({
              inputRange: [0, APPEAR_END, HOVER_END, 1],
              outputRange: [0.3, 1, 1, 0.35],
            }),
          },
        ],
      }}
    >
      <Animated.View
        style={{
          transform: [
            { translateY: wobble.interpolate({ inputRange: [0, 1], outputRange: [-4, 4] }) },
            { rotate: wobble.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }) },
          ],
        }}
      >
        <View style={{ position: 'absolute', left: W / 2 - 30, top: H - 14 }}>
          <Glow id="ufoGlow" size={60} color="#9FE8C8" core={0.5} />
        </View>
        <Svg width={W} height={H}>
          <Path d="M 18 14 C 18 4, 38 4, 38 14 Z" fill="#CFE0FF" opacity={0.85} />
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
            {LIGHTS.map((lx, i) => (
              <Circle key={lx} cx={lx} cy={19} r={1.8} fill={i % 2 ? '#FFE27A' : '#8FF0D2'} />
            ))}
          </Svg>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}
