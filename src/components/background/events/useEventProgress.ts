import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * A 0 → 1 value that animates once over `durationMs` when the event mounts,
 * then calls `onDone`. Uses the native driver.
 */
export function useEventProgress(
  durationMs: number,
  onDone: () => void,
  easing: (t: number) => number = Easing.linear,
) {
  const [progress] = useState(() => new Animated.Value(0));
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) done.current();
    });
    return () => anim.stop();
  }, [progress, durationMs, easing]);
  return progress;
}
