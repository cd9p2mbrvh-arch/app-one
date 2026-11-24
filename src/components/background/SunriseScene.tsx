import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Polygon, RadialGradient, Stop } from 'react-native-svg';

import { Airplane, Birds, SceneEvents } from './events';
import { Glow } from './Glow';
import { seededRandom, useLoop, useOscillator, type SceneProps } from './motion';

const MORNING_EVENTS = { airplane: Airplane, birds: Birds };

/**
 * Morning: the sun rising in the upper right with a breathing glow and slowly
 * turning light rays; soft clouds drift by and specks of light float upwards.
 * Now and then an airplane or a flock of birds passes.
 */
export function SunriseScene({ width, height, still, topInset = 0 }: SceneProps) {
  // Upper right, so the glow and turning rays frame the top of the screen.
  const sunX = width * 0.86;
  const sunY = topInset + height * 0.12;
  const sunR = width * 0.16;
  const raysSize = width * 1.8;

  const rayTurn = useLoop(70000, still);
  const breathe = useOscillator(5000, still);
  const rise = useOscillator(16000, still);

  const rayCount = 14;
  const rays = Array.from({ length: rayCount }, (_, i) => {
    const a = (i / rayCount) * Math.PI * 2;
    const spread = 0.07;
    const c = raysSize / 2;
    const r = raysSize / 2;
    return `${c},${c} ${c + r * Math.cos(a - spread)},${c + r * Math.sin(a - spread)} ${c + r * Math.cos(a + spread)},${c + r * Math.sin(a + spread)}`;
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Light rays, turning slowly */}
      <Animated.View
        style={{
          position: 'absolute',
          left: sunX - raysSize / 2,
          top: sunY - raysSize / 2,
          width: raysSize,
          height: raysSize,
          opacity: 0.7,
          transform: [
            {
              rotate: rayTurn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }),
            },
          ],
        }}
      >
        <Svg width={raysSize} height={raysSize}>
          <Defs>
            <RadialGradient id="rayFade" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <G fill="url(#rayFade)">
            {rays.map((points, i) => (
              <Polygon key={i} points={points} />
            ))}
          </G>
        </Svg>
      </Animated.View>

      {/* The sun with a breathing glow, rising and settling gently */}
      <Animated.View
        style={{
          position: 'absolute',
          left: sunX - sunR * 4,
          top: sunY - sunR * 4,
          width: sunR * 8,
          height: sunR * 8,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [
            { translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, -14] }) },
          ],
        }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            transform: [
              { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) },
            ],
          }}
        >
          <Glow id="sunGlow" size={sunR * 8} color="#FFD9A0" />
        </Animated.View>
        <Svg width={sunR * 2.4} height={sunR * 2.4}>
          <Defs>
            <RadialGradient id="sunDisc" cx="45%" cy="40%" r="60%">
              <Stop offset="0" stopColor="#FFFDF2" />
              <Stop offset="1" stopColor="#FFF0C2" />
            </RadialGradient>
          </Defs>
          <Circle cx={sunR * 1.2} cy={sunR * 1.2} r={sunR} fill="url(#sunDisc)" />
        </Svg>
      </Animated.View>

      <Clouds width={width} height={height} still={still} topInset={topInset} />
      <Motes width={width} height={height} still={still} topInset={topInset} />
      <SceneEvents
        events={MORNING_EVENTS}
        width={width}
        height={height}
        topInset={topInset}
        still={still}
      />
    </View>
  );
}

function Clouds({ width, height, still }: SceneProps) {
  const clouds = [
    { y: 0.42, scale: 1, speed: 60000, delay: 0, opacity: 0.8 },
    { y: 0.12, scale: 0.7, speed: 80000, delay: 20000, opacity: 0.65 },
    { y: 0.7, scale: 1.2, speed: 70000, delay: 35000, opacity: 0.55 },
  ];
  return (
    <>
      {clouds.map((c, i) => (
        <Cloud key={i} index={i} {...c} width={width} height={height} still={still} />
      ))}
    </>
  );
}

function Cloud({
  index,
  y,
  scale,
  speed,
  delay,
  opacity,
  width,
  height,
  still,
}: SceneProps & {
  index: number;
  y: number;
  scale: number;
  speed: number;
  delay: number;
  opacity: number;
}) {
  const w = width * 0.75 * scale;
  const h = w * 0.4;
  const drift = useLoop(speed, still, delay);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: height * y,
        left: 0,
        opacity,
        transform: [
          {
            translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-w, width] }),
          },
        ],
      }}
    >
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id={`cloud${index}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <G fill={`url(#cloud${index})`}>
          <Ellipse cx={w * 0.35} cy={h * 0.6} rx={w * 0.33} ry={h * 0.4} />
          <Ellipse cx={w * 0.55} cy={h * 0.45} rx={w * 0.3} ry={h * 0.45} />
          <Ellipse cx={w * 0.72} cy={h * 0.62} rx={w * 0.26} ry={h * 0.36} />
        </G>
      </Svg>
    </Animated.View>
  );
}

/** Specks of light floating slowly upwards, like dust catching the morning sun. */
function Motes({ width, height, still }: SceneProps) {
  const random = seededRandom(7);
  const motes = Array.from({ length: 9 }, () => ({
    x: random() * width,
    y: height * (0.35 + random() * 0.6),
    size: 10 + random() * 14,
    speed: 14000 + random() * 12000,
    delay: random() * 10000,
  }));
  return (
    <>
      {motes.map((m, i) => (
        <Mote key={i} index={i} {...m} still={still} />
      ))}
    </>
  );
}

function Mote({
  index,
  x,
  y,
  size,
  speed,
  delay,
  still,
}: {
  index: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  delay: number;
  still: boolean;
}) {
  const float = useLoop(speed, still, delay);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: float.interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 0.9, 0.9, 0] }),
        transform: [
          { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -140] }) },
          { translateX: float.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, 0] }) },
        ],
      }}
    >
      <Glow id={`mote${index}`} size={size} color="#FFF4C8" core={1} />
    </Animated.View>
  );
}
