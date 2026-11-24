import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ALL_PERIODS_BONUS } from '@/domain/xp';
import { radius, spacing, useTheme, type TimeOfDay } from '@/theme';

import { AppText } from './AppText';
import type { IconName } from './OptionCard';

const PERIODS: { key: TimeOfDay; label: string; icon: IconName }[] = [
  { key: 'morning', label: 'Morning', icon: 'partly-sunny-outline' },
  { key: 'noon', label: 'Noon', icon: 'sunny-outline' },
  { key: 'night', label: 'Night', icon: 'moon-outline' },
];

/** Today's morning / noon / night meditations, towards the +50 XP bonus. */
export function DayTracker({ done }: { done: TimeOfDay[] }) {
  const { colors } = useTheme();
  const all = PERIODS.every((p) => done.includes(p.key));
  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessible
      accessibilityLabel={`Today: ${PERIODS.map((p) => `${p.label} ${done.includes(p.key) ? 'done' : 'not yet'}`).join(', ')}.`}
      testID="day-tracker"
    >
      <View style={styles.row}>
        {PERIODS.map((p) => {
          const isDone = done.includes(p.key);
          return (
            <View key={p.key} style={styles.item}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDone ? colors.primary : 'transparent',
                    borderColor: isDone ? colors.primary : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={isDone ? 'checkmark' : p.icon}
                  size={20}
                  color={isDone ? colors.onPrimary : colors.textMuted}
                />
              </View>
              <AppText variant="caption" color={isDone ? colors.text : colors.textMuted}>
                {p.label}
              </AppText>
            </View>
          );
        })}
      </View>
      <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
        {all
          ? `All three today: +${ALL_PERIODS_BONUS} XP earned!`
          : `Complete a session in the morning, at noon and at night for +${ALL_PERIODS_BONUS} XP.`}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 2, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  item: { alignItems: 'center', gap: 4 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { textAlign: 'center' },
});
