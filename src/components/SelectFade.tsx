import { useEffect, useState, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { useReduceMotion } from '@/hooks/useReduceMotion';

/** Length of the selection fade: short and quick. */
export const SELECT_FADE_MS = 160;

/** Fades its children in when `on` becomes true and out when it becomes false. */
export function Fade({
  on,
  style,
  children,
}: {
  on: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(on ? 1 : 0));
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(on ? 1 : 0);
      return;
    }
    const anim = Animated.timing(opacity, {
      toValue: on ? 1 : 0,
      duration: SELECT_FADE_MS,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [on, opacity, reduceMotion]);
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

/** Fades in once when it appears (used for the row's details). */
export function FadeIn({ children }: { children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) return opacity.setValue(1);
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration: SELECT_FADE_MS,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [opacity, reduceMotion]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}
