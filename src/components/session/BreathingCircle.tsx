import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useTheme } from '@/theme';

import { AppText } from '../AppText';

export const BREATH_MS = 4000;

type Props = {
  size: number;
  /** Animates only while running (paused sessions stand still). */
  running: boolean;
  children?: ReactNode;
};

/**
 * A soft circle that grows as you breathe in and shrinks as you breathe out,
 * 4 seconds each, with a matching "Breathe in / Breathe out" label.
 */
export function BreathingCircle({ size, running, children }: Props) {
  const { colors } = useTheme();
  const still = useReduceMotion();
  const [scale] = useState(() => new Animated.Value(0.82));
  const [phase, setPhase] = useState<'in' | 'out'>('in');

  useEffect(() => {
    if (!running) return;
    // Continue from the current phase, so resuming after a pause feels natural.
    let current: 'in' | 'out' = phase;
    const breathe = (to: 'in' | 'out') =>
      Animated.timing(scale, {
        toValue: to === 'in' ? 1.08 : 0.82,
        duration: BREATH_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = still
      ? null
      : Animated.loop(
          Animated.sequence(
            current === 'in' ? [breathe('in'), breathe('out')] : [breathe('out'), breathe('in')],
          ),
        );
    loop?.start();
    const timer = setInterval(() => {
      current = current === 'in' ? 'out' : 'in';
      setPhase(current);
    }, BREATH_MS);
    return () => {
      loop?.stop();
      clearInterval(timer);
    };
    // `phase` is read only when (re)starting, on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, still, scale]);

  const ring = (factor: number, opacity: number) => (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size * factor,
          height: size * factor,
          borderRadius: (size * factor) / 2,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.stack, { width: size, height: size }]}>
        {ring(1, 0.55)}
        {ring(0.78, 0.8)}
        {ring(0.58, 1)}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.center}>{children}</View>
        </View>
      </View>
      <AppText variant="heading" color={colors.textMuted} testID="breath-label">
        {running ? (phase === 'in' ? 'Breathe in' : 'Breathe out') : 'Paused'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 12 },
  stack: { alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
