import * as Haptics from 'expo-haptics';

/**
 * All haptic feedback in one place so strength can be tuned in a single spot.
 * Failures (e.g. no haptic engine, web) are ignored.
 */
const safe = (p: Promise<void>) => {
  p.catch(() => {});
};

/** A step on a dial or wheel (one minute). */
export function tick() {
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** A notable step, e.g. every 5 minutes on the time dial. */
export function majorTick() {
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

/** Choosing something: a card, a row, a tab. */
export function tap() {
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
