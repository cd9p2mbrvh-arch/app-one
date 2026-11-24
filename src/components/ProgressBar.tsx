import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  /** Progress from 0 to 1; values outside that range are clamped. */
  value: number;
  height?: number;
  accessibilityLabel?: string;
  testID?: string;
};

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({ value, height = 16, accessibilityLabel, testID }: Props) {
  const progress = clampProgress(value);
  const percent = Math.round(progress * 100);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { height, borderRadius: radius.pill }]}
    >
      <View
        testID={testID ? `${testID}-fill` : undefined}
        style={[styles.fill, { width: `${percent}%`, borderRadius: radius.pill }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
});
