import { View } from 'react-native';

import { radius, useTheme } from '@/theme';

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
  const { colors } = useTheme();
  const percent = Math.round(clampProgress(value) * 100);
  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={{
        height,
        borderRadius: radius.pill,
        backgroundColor: colors.track,
        overflow: 'hidden',
      }}
    >
      <View
        testID={testID ? `${testID}-fill` : undefined}
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
