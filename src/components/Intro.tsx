import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Circle,
} from 'react-native-svg';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { fonts, useTheme } from '@/theme';
import { shade } from '@/theme/color';

import { AppText } from './AppText';

/** Timing of the launch intro, in ms (about 2 s in total). */
export const INTRO = {
  logoIn: 450,
  /** When the intro starts fading and the app starts zooming in. */
  fadeAt: 1300,
  fadeOut: 450,
  /** How long the app's zoom-in takes (starts at fadeAt). */
  appZoom: 650,
} as const;

type Props = {
  /** Called when the intro starts fading: time to bring the app in. */
  onReveal: () => void;
  /** Called when the intro is gone. */
  onDone: () => void;
};

/** The studio logo: a glossy tile with a soft "M", and the name. */
export function StudioLogo({ size = 88 }: { size?: number }) {
  const { colors } = useTheme();
  const base = colors.primary;
  const r = size * 0.3;
  return (
    <View style={styles.logo} accessible accessibilityLabel="Michael apps">
      <View
        style={{
          width: size,
          height: size,
          borderRadius: r,
          boxShadow: `0px ${size * 0.14}px ${size * 0.32}px ${shade(base, -0.4)}66`,
        }}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Defs>
            <LinearGradient id="introTile" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={shade(base, 0.35)} />
              <Stop offset="1" stopColor={shade(base, -0.25)} />
            </LinearGradient>
            <LinearGradient id="introGloss" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={64} height={64} rx={19} fill="url(#introTile)" />
          <Ellipse cx={27} cy={15} rx={20} ry={9} fill="url(#introGloss)" />
          {/* A soft "M", like two gentle hills. */}
          <Path
            d="M16 44 V25 Q16 19 21 23 L32 33 L43 23 Q48 19 48 25 V44"
            fill="none"
            stroke={colors.onPrimary}
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <View style={styles.wordmark}>
        <AppText style={[styles.word, { color: colors.text, fontFamily: fonts.black }]}>
          Michael
        </AppText>
        <AppText style={[styles.word, { color: colors.textMuted, fontFamily: fonts.regular }]}>
          {' '}
          apps
        </AppText>
      </View>
    </View>
  );
}

/**
 * Short launch intro: soft colour clouds drifting behind a heavy blur, with the
 * studio logo. After about 1.3 s it fades away while the app zooms in.
 */
export function Intro({ onReveal, onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const { backdrop, colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [logo] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const driftAnim = Animated.timing(drift, {
      toValue: 1,
      duration: INTRO.fadeAt + INTRO.fadeOut,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    });
    if (!reduceMotion) driftAnim.start();
    const show = Animated.timing(logo, {
      toValue: 1,
      duration: INTRO.logoIn,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    show.start();
    const timer = setTimeout(() => {
      onReveal();
      Animated.timing(fade, {
        toValue: 0,
        duration: INTRO.fadeOut,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => onDone());
    }, INTRO.fadeAt);
    return () => {
      clearTimeout(timer);
      show.stop();
      driftAnim.stop();
    };
    // Runs once, on launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [a, b, c] = [
    backdrop.gradient[0],
    colors.primary,
    backdrop.sceneColors[1] ?? backdrop.gradient[2],
  ];
  const blob = Math.max(width, height) * 0.75;
  const move = (dx: number, dy: number, scale = 1) => ({
    transform: [
      { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
      { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
      { scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }) },
    ],
  });

  return (
    <Animated.View
      pointerEvents="none"
      testID="intro"
      style={[StyleSheet.absoluteFill, { backgroundColor: backdrop.gradient[1], opacity: fade }]}
    >
      {[
        {
          color: a,
          left: -blob * 0.35,
          top: -blob * 0.3,
          style: move(width * 0.25, height * 0.12, 1.15),
        },
        {
          color: b,
          left: width - blob * 0.6,
          top: height * 0.35,
          style: move(-width * 0.3, -height * 0.1, 1.1),
        },
        {
          color: c,
          left: -blob * 0.2,
          top: height - blob * 0.55,
          style: move(width * 0.2, -height * 0.15, 0.95),
        },
      ].map((cloud, i) => (
        <Animated.View
          key={i}
          style={[
            { position: 'absolute', left: cloud.left, top: cloud.top, width: blob, height: blob },
            cloud.style,
          ]}
        >
          <Svg width={blob} height={blob}>
            <Defs>
              <RadialGradient id={`introCloud${i}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={cloud.color} stopOpacity={i === 1 ? 0.5 : 1} />
                <Stop offset="1" stopColor={cloud.color} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={blob / 2} cy={blob / 2} r={blob / 2} fill={`url(#introCloud${i})`} />
          </Svg>
        </Animated.View>
      ))}
      <BlurView intensity={45} tint={backdrop.glass} style={StyleSheet.absoluteFill} />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.center,
          {
            opacity: logo,
            transform: [
              {
                scale: logo.interpolate({
                  inputRange: [0, 1],
                  outputRange: [reduceMotion ? 1 : 0.85, 1],
                }),
              },
            ],
          },
        ]}
      >
        <StudioLogo />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  logo: { alignItems: 'center', gap: 16 },
  wordmark: { flexDirection: 'row', alignItems: 'baseline' },
  word: { fontSize: 26, lineHeight: 32, letterSpacing: 0.3 },
});
