import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Shared animation helpers for the background scenes. All use the native driver
 * (transforms and opacity only), so they run off the JavaScript thread. When
 * `still` is true (system Reduce Motion), values rest in the middle and nothing
 * animates.
 */

/** A value that swings 0 → 1 → 0 forever with a smooth sine ease. */
export function useOscillator(durationMs: number, still: boolean, delayMs = 0) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (still) {
      value.setValue(0.5);
      return;
    }
    const swing = (toValue: number) =>
      Animated.timing(value, {
        toValue,
        duration: durationMs,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const anim = Animated.sequence([
      Animated.delay(delayMs),
      Animated.loop(Animated.sequence([swing(1), swing(0)])),
    ]);
    anim.start();
    return () => anim.stop();
  }, [value, durationMs, delayMs, still]);
  return value;
}

/** A value that runs 0 → 1 linearly and restarts, e.g. for rotation or drifting. */
export function useLoop(durationMs: number, still: boolean, delayMs = 0) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (still) {
      value.setValue(0.5);
      return;
    }
    value.setValue(0);
    const anim = Animated.sequence([
      Animated.delay(delayMs),
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ),
    ]);
    anim.start();
    return () => anim.stop();
  }, [value, durationMs, delayMs, still]);
  return value;
}

/** Small deterministic pseudo-random generator, so scenes look the same every launch. */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SceneProps = {
  width: number;
  height: number;
  still: boolean;
  /** Height of the notch / status bar area, so scene details can line up with the header. */
  topInset?: number;
};
