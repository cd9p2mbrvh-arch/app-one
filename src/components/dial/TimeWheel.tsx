import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { majorTick, tick } from '@/feedback';
import { useTheme } from '@/theme';

import { AppText } from '../AppText';
import { hapticForStep, speedBetween } from './dialHaptics';
import { angleOf, DIAL_MAX, DIAL_MIN, pointAt, stepValue } from './dialMath';
import {
  angleDelta,
  rotationForValue,
  settledValue,
  valueAfterTurn,
  valueAtTouch,
  wheelAngleOf,
} from './wheelMath';

type Props = {
  value: number;
  /** Called when the wheel settles after a turn or tap, or after an accessibility step. */
  onChange: (minutes: number) => void;
  size: number;
  testID?: string;
};

/** Labels every 5 minutes, from the minimum up to 60. */
const LABELS = Array.from({ length: 12 }, (_, i) => (i + 1) * 5).filter((m) => m >= DIAL_MIN);
/** A touch that turned the wheel less than this counts as a tap. */
const TAP_DEGREES = 4;
const POINTER = 14;

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
  const [current, setCurrent] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [rotation] = useState(() => new Animated.Value(rotationForValue(value)));
  const [counter] = useState(() => deg(rotation, -1));
  const [wheelTurn] = useState(() => deg(rotation, 1));
  const live = useRef(value);
  const drag = useRef({ exact: value, lastAngle: 0, grantAngle: 0, moved: 0, nearCentre: false });
  const pacing = useRef({ lastHapticAt: -Infinity, sampleValue: value, sampleTime: 0 });

  // Follow changes from outside (e.g. a reset).
  if (value !== prevValue) {
    setPrevValue(value);
    setCurrent(value);
  }
  useEffect(() => {
    live.current = value;
    rotation.setValue(rotationForValue(value));
  }, [value, rotation]);

  const center = size / 2;
  const outer = center - POINTER - 4;
  const labelRadius = outer - 34;
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
    if (haptic === 'major') majorTick();
    else if (haptic === 'minor') tick();
  };

  const settleTo = (target: number) => {
    Animated.timing(rotation, {
      toValue: rotationForValue(target),
      duration: 180,
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
    const t = touch(e);
    live.current = current;
    drag.current = {
      exact: current,
      lastAngle: t.angle,
      grantAngle: t.angle,
      moved: 0,
      nearCentre: t.nearCentre,
    };
    pacing.current.sampleValue = current;
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
    d.exact = valueAfterTurn(d.exact, delta);
    rotation.setValue(rotationForValue(d.exact));
    update(settledValue(d.exact), e.nativeEvent.timestamp);
  };

  const onRelease = (e?: GestureResponderEvent) => {
    const d = drag.current;
    if (d.moved < TAP_DEGREES) {
      if (d.nearCentre) return settleTo(live.current);
      // A tap: turn to the number that was touched.
      const target = valueAtTouch(d.grantAngle, live.current);
      pacing.current.sampleTime = -Infinity;
      update(target, e?.nativeEvent.timestamp ?? Date.now());
      return settleTo(target);
    }
    settleTo(settledValue(d.exact));
  };

  const step = (direction: 1 | -1) => {
    live.current = current;
    pacing.current.sampleTime = -Infinity;
    const next = stepValue(current, direction);
    update(next, Number.MAX_SAFE_INTEGER);
    settleTo(next);
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
          {LABELS.map((m) => {
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
                  color={selected ? colors.primary : colors.textMuted}
                  style={selected ? styles.selectedLabel : undefined}
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
  selectedLabel: { fontSize: 20, lineHeight: 24 },
  center: { alignItems: 'center', justifyContent: 'center' },
  bigNumber: { fontSize: 56, lineHeight: 62 },
});
