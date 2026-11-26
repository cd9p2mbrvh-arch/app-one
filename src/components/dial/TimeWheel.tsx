import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { wheelMajorTick, wheelTick } from '@/feedback';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { fonts, useTheme } from '@/theme';

import { AppText } from '../AppText';
import { hapticForStep, speedBetween } from './dialHaptics';
import { angleOf, DEG_PER_MINUTE, DIAL_MAX, DIAL_MIN, pointAt, stepValue } from './dialMath';
import {
  angleDelta,
  crossedMinute,
  rotationForValue,
  settledValue,
  valueAfterTurn,
  valueAtTouch,
  wheelAngleOf,
  WHEEL_DIRECTION,
  WHEEL_LABELS,
} from './wheelMath';

type Props = {
  value: number;
  /** Called when the wheel settles after a turn or tap, or after an accessibility step. */
  onChange: (minutes: number) => void;
  size: number;
  testID?: string;
};

/** A touch that turned the wheel less than this counts as a tap. */
const TAP_DEGREES = 4;
const POINTER = 14;
/** Tap-to-spin timing: quick for nearby numbers, never longer than SPIN_MAX_MS. */
const SPIN_BASE_MS = 220;
const SPIN_MS_PER_MINUTE = 22;
const SPIN_MAX_MS = 650;
/** Width of the soft range band under the ticks. */
const BAND = 14;

/** Degrees → rotate string; `sign` -1 turns the other way (keeps labels upright). */
const deg = (v: Animated.Value, sign: 1 | -1) =>
  v.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', `${sign * 360}deg`],
    extrapolate: 'extend',
  });

/**
 * Rotating duration wheel: the whole wheel turns under a fixed marker at the top,
 * and the number under the marker is the chosen time. Turn clockwise to add time.
 * Tap a number to turn straight to it. Haptic tick every minute, firmer every 5.
 */
export function TimeWheel({ value, onChange, size, testID }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReduceMotion();
  const [current, setCurrent] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [rotation] = useState(() => new Animated.Value(rotationForValue(value)));
  const [counter] = useState(() => deg(rotation, -1));
  const [wheelTurn] = useState(() => deg(rotation, 1));
  const live = useRef(value);
  /** Exact wheel position in minutes (may be between marks while moving). */
  const position = useRef(value);
  const spinFrame = useRef<number | null>(null);
  const drag = useRef({ exact: value, lastAngle: 0, grantAngle: 0, moved: 0, nearCentre: false });
  const pacing = useRef({ lastHapticAt: -Infinity, sampleValue: value, sampleTime: 0 });

  // Follow changes from outside (e.g. a reset).
  if (value !== prevValue) {
    setPrevValue(value);
    setCurrent(value);
  }
  useEffect(() => {
    // An outside change (not our own spin finishing) moves the wheel straight there.
    if (spinFrame.current !== null) return;
    live.current = value;
    position.current = value;
    rotation.setValue(rotationForValue(value));
  }, [value, rotation]);
  useEffect(
    () => () => {
      if (spinFrame.current !== null) cancelAnimationFrame(spinFrame.current);
    },
    [],
  );

  const center = size / 2;
  const outer = center - POINTER - 4;
  const labelRadius = outer - 38;
  // Arc of the choosable range, from the minimum to the maximum mark.
  const bandRadius = outer - 10;
  const from = pointAt(wheelAngleOf(DIAL_MIN), bandRadius);
  const to = pointAt(wheelAngleOf(DIAL_MAX), bandRadius);
  const span = (DIAL_MAX - DIAL_MIN) * DEG_PER_MINUTE;
  const rangeArc = `M ${center + from.x} ${center + from.y} A ${bandRadius} ${bandRadius} 0 ${
    span > 180 ? 1 : 0
  } ${WHEEL_DIRECTION === -1 ? 1 : 0} ${center + to.x} ${center + to.y}`;
  const hubRadius = outer * 0.5;

  const update = (next: number, now: number) => {
    if (next === live.current) return;
    const p = pacing.current;
    const speed = speedBetween(p.sampleValue, p.sampleTime, next, now);
    p.sampleValue = next;
    p.sampleTime = now;
    live.current = next;
    setCurrent(next);
    const haptic = hapticForStep({ value: next, now, lastHapticAt: p.lastHapticAt, speed });
    if (haptic) p.lastHapticAt = now;
    if (haptic === 'major') wheelMajorTick();
    else if (haptic === 'minor') wheelTick();
  };

  /**
   * Spins the wheel smoothly to `target` (after a tap or a VoiceOver step): quick
   * but not instant, easing in and out. The number counts through the minutes on
   * the way and each passing line clicks, as if the wheel were turned by hand.
   */
  const spinTo = (target: number, opts: { valueFirst?: boolean } = {}) => {
    stopSpin();
    const from = position.current;
    const distance = Math.abs(target - from);
    // VoiceOver needs the new value at once; Reduce Motion skips the spin.
    if (opts.valueFirst || reduceMotion || distance < 0.001) {
      update(target, Number.MAX_SAFE_INTEGER);
      return settleTo(target);
    }
    const duration = Math.min(SPIN_MAX_MS, SPIN_BASE_MS + distance * SPIN_MS_PER_MINUTE);
    let start: number | null = null;
    let prev = from;
    const frame = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const exact = from + (target - from) * eased;
      position.current = exact;
      rotation.setValue(rotationForValue(exact));
      const line = crossedMinute(prev, exact);
      if (line !== null) update(line, now);
      prev = exact;
      if (t < 1) {
        spinFrame.current = requestAnimationFrame(frame);
      } else {
        spinFrame.current = null;
        update(target, now);
        onChange(target);
      }
    };
    spinFrame.current = requestAnimationFrame(frame);
  };

  const stopSpin = () => {
    if (spinFrame.current !== null) cancelAnimationFrame(spinFrame.current);
    spinFrame.current = null;
  };

  const settleTo = (target: number) => {
    position.current = target;
    Animated.timing(rotation, {
      toValue: rotationForValue(target),
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    onChange(target);
  };

  const touch = (e: GestureResponderEvent) => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    return {
      angle: angleOf(x, y, center, center),
      nearCentre: Math.hypot(x - center, y - center) < size * 0.12,
    };
  };

  const onGrant = (e: GestureResponderEvent) => {
    rotation.stopAnimation();
    // Catching the wheel mid-spin holds it where it is.
    const spinning = spinFrame.current !== null;
    stopSpin();
    const t = touch(e);
    if (!spinning) position.current = live.current;
    drag.current = {
      exact: position.current,
      lastAngle: t.angle,
      grantAngle: t.angle,
      moved: 0,
      nearCentre: t.nearCentre,
    };
    pacing.current.sampleValue = live.current;
    pacing.current.sampleTime = e.nativeEvent.timestamp;
  };

  const onMove = (e: GestureResponderEvent) => {
    const d = drag.current;
    const t = touch(e);
    const delta = angleDelta(d.lastAngle, t.angle);
    d.lastAngle = t.angle;
    // Angles jump around near the centre; ignore them there.
    if (t.nearCentre) return;
    d.moved += Math.abs(delta);
    const prev = d.exact;
    d.exact = valueAfterTurn(d.exact, delta);
    position.current = d.exact;
    rotation.setValue(rotationForValue(d.exact));
    // Tick and change the number when a minute line reaches the marker, not halfway.
    const line = crossedMinute(prev, d.exact);
    if (line !== null) update(line, e.nativeEvent.timestamp);
  };

  const onRelease = (e?: GestureResponderEvent) => {
    const d = drag.current;
    if (d.moved < TAP_DEGREES) {
      if (d.nearCentre) return settleTo(settledValue(d.exact));
      // A tap: spin to the number that was touched.
      pacing.current.sampleTime = -Infinity;
      return spinTo(valueAtTouch(d.grantAngle, settledValue(d.exact)));
    }
    // Snapping to the nearest minute may carry one more line under the marker.
    const target = settledValue(d.exact);
    update(target, e?.nativeEvent.timestamp ?? Date.now());
    settleTo(target);
  };

  const step = (direction: 1 | -1) => {
    pacing.current.sampleTime = -Infinity;
    spinTo(stepValue(live.current, direction), { valueFirst: true });
  };

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Time"
      accessibilityValue={{ text: `${current} minutes` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={onGrant}
      onResponderMove={onMove}
      onResponderRelease={onRelease}
      onResponderTerminate={() => onRelease()}
      style={{ width: size, height: size }}
    >
      {/* Children ignore touches so locationX/Y are always relative to the wheel. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* The turning part: disc, ticks and numbers. */}
        <Animated.View
          testID={testID ? `${testID}-wheel` : undefined}
          style={[StyleSheet.absoluteFill, { transform: [{ rotate: wheelTurn }] }]}
        >
          <Svg width={size} height={size}>
            <Circle
              cx={center}
              cy={center}
              r={outer}
              fill={colors.surface}
              stroke={colors.border}
              strokeWidth={2}
            />
            {/* Soft band under the ticks marking the choosable range (5–30). */}
            <Path
              d={rangeArc}
              fill="none"
              stroke={colors.primary}
              strokeOpacity={0.18}
              strokeWidth={BAND}
              strokeLinecap="round"
            />
            {Array.from({ length: DIAL_MAX - DIAL_MIN + 1 }, (_, i) => {
              const m = DIAL_MIN + i;
              const major = m % 5 === 0;
              const a = pointAt(wheelAngleOf(m), outer - 4);
              const b = pointAt(wheelAngleOf(m), outer - (major ? 16 : 10));
              return (
                <Line
                  key={m}
                  x1={center + a.x}
                  y1={center + a.y}
                  x2={center + b.x}
                  y2={center + b.y}
                  stroke={major ? colors.text : colors.textMuted}
                  strokeWidth={major ? 2 : 1}
                  strokeOpacity={major ? 0.8 : 0.45}
                />
              );
            })}
          </Svg>
          {WHEEL_LABELS.map((m) => {
            const p = pointAt(wheelAngleOf(m), labelRadius);
            const selected = m === current;
            return (
              <Animated.View
                key={m}
                style={[
                  styles.label,
                  {
                    left: center + p.x - 18,
                    top: center + p.y - 12,
                    transform: [{ rotate: counter }],
                  },
                ]}
              >
                <AppText
                  variant="label"
                  color={selected ? colors.primary : colors.text}
                  style={selected ? styles.selectedLabel : styles.number}
                >
                  {m}
                </AppText>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Fixed parts: pointer at the top, hub with the big number. */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Path
            d={`M ${center - POINTER} 2 L ${center + POINTER} 2 L ${center} ${POINTER + 8} Z`}
            fill={colors.primary}
          />
          <Line
            x1={center}
            y1={POINTER + 6}
            x2={center}
            y2={POINTER + 4 + 22}
            stroke={colors.primary}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Circle
            cx={center}
            cy={center}
            r={hubRadius}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth={2}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <AppText
            variant="title"
            style={styles.bigNumber}
            testID={testID ? `${testID}-value` : undefined}
          >
            {current}
          </AppText>
          <AppText variant="label" color={colors.textMuted}>
            minutes
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', width: 36, height: 24, alignItems: 'center' },
  number: { fontSize: 18, lineHeight: 24 },
  selectedLabel: { fontSize: 22, lineHeight: 26, fontFamily: fonts.black },
  center: { alignItems: 'center', justifyContent: 'center' },
  bigNumber: { fontSize: 56, lineHeight: 62 },
});
