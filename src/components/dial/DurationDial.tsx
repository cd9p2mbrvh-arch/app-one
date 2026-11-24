import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { majorTick, tick } from '@/feedback';
import { useTheme } from '@/theme';

import { AppText } from '../AppText';
import {
  angleForValue,
  angleOf,
  DIAL_MAX,
  pointAt,
  stepValue,
  valueForDrag,
  valueForTap,
} from './dialMath';

type Props = {
  value: number;
  /** Called when the finger lifts, or after an accessibility step. */
  onChange: (minutes: number) => void;
  size: number;
  testID?: string;
};

const RING = 16;
const KNOB = 34;
const LABELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

/**
 * Clock-face duration picker: one full circle is 60 minutes. Tap anywhere on the
 * dial to jump to that time, or drag around it. Haptic tick every minute and a
 * stronger one every 5 minutes.
 */
export function DurationDial({ value, onChange, size, testID }: Props) {
  const { colors } = useTheme();
  const [current, setCurrent] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const live = useRef(value);

  // Follow changes from outside (e.g. a reset).
  if (value !== prevValue) {
    setPrevValue(value);
    setCurrent(value);
  }

  const center = size / 2;
  // Leave room for the knob, which sits on the ring.
  const ringRadius = center - KNOB / 2 - 2;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = current / DIAL_MAX;

  const update = (next: number) => {
    if (next === live.current) return;
    live.current = next;
    setCurrent(next);
    if (next % 5 === 0) majorTick();
    else tick();
  };

  const angleFromEvent = (e: GestureResponderEvent) =>
    angleOf(e.nativeEvent.locationX, e.nativeEvent.locationY, center, center);

  const onGrant = (e: GestureResponderEvent) => {
    live.current = current;
    update(valueForTap(angleFromEvent(e)));
  };
  const onMove = (e: GestureResponderEvent) =>
    update(valueForDrag(live.current, angleFromEvent(e)));
  const onRelease = () => onChange(live.current);

  const step = (direction: 1 | -1) => {
    live.current = current;
    const next = stepValue(current, direction);
    update(next);
    onChange(next);
  };

  const knob = pointAt(angleForValue(current), ringRadius);
  const labelRadius = ringRadius - RING / 2 - 30;

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
      onResponderTerminate={onRelease}
      style={{ width: size, height: size }}
    >
      {/* Children ignore touches so locationX/Y are always relative to the dial. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={center - 2}
            fill={colors.surface}
            stroke={colors.border}
            strokeWidth={2}
          />
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            stroke={colors.track}
            strokeWidth={RING}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={ringRadius}
            stroke={colors.primary}
            strokeWidth={RING}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            transform={`rotate(-90 ${center} ${center})`}
          />
          {Array.from({ length: 60 }, (_, m) => {
            const major = m % 5 === 0;
            const outer = pointAt(m * 6, ringRadius - RING / 2 - 4);
            const inner = pointAt(m * 6, ringRadius - RING / 2 - (major ? 14 : 8));
            return (
              <Line
                key={m}
                x1={center + outer.x}
                y1={center + outer.y}
                x2={center + inner.x}
                y2={center + inner.y}
                stroke={major ? colors.text : colors.textMuted}
                strokeWidth={major ? 2 : 1}
                strokeOpacity={major ? 0.8 : 0.45}
              />
            );
          })}
        </Svg>

        {LABELS.map((m) => {
          const p = pointAt(m * 6, labelRadius);
          return (
            <View
              key={m}
              style={[styles.label, { left: center + p.x - 16, top: center + p.y - 10 }]}
            >
              <AppText variant="caption" color={m <= current ? colors.text : colors.textMuted}>
                {m}
              </AppText>
            </View>
          );
        })}

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

        <View
          testID={testID ? `${testID}-knob` : undefined}
          style={[
            styles.knob,
            {
              left: center + knob.x - KNOB / 2,
              top: center + knob.y - KNOB / 2,
              backgroundColor: colors.primary,
              borderColor: colors.onPrimary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', width: 32, height: 20, alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  bigNumber: { fontSize: 56, lineHeight: 62 },
  knob: {
    position: 'absolute',
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    borderWidth: 4,
  },
});
