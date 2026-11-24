import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, BackButton, DayTracker, ProgressBar, Screen } from '@/components';
import type { IconName } from '@/components';
import { THEMES } from '@/content/manifest';
import { formatSessionDate, formatSessionLength } from '@/domain/format';
import { levelForXp, xpToReachLevel } from '@/domain/progress';
import { useActiveProfile } from '@/state/profiles';
import { periodsToday, useProfileProgress, type SessionRecord } from '@/state/progress';
import { radius, spacing, useTheme, type TimeOfDay } from '@/theme';

const PERIOD_ICONS: Record<TimeOfDay, IconName> = {
  morning: 'partly-sunny-outline',
  noon: 'sunny-outline',
  night: 'moon-outline',
};

/** The active profile's progress and a simple list of past meditations. */
export default function HistoryScreen() {
  const { colors } = useTheme();
  const profile = useActiveProfile();
  const progress = useProfileProgress(profile?.id);

  if (!profile) return <Redirect href="/" />;

  const level = levelForXp(progress.totalXp);
  const start = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton />
        <Avatar avatar={profile.avatar} size={48} />
        <View style={styles.headerText}>
          <AppText variant="heading">{profile.name}</AppText>
          <AppText variant="caption" color={colors.accent}>
            Level {level} · {progress.totalXp - start} / {next - start} XP to level {level + 1}
          </AppText>
        </View>
      </View>
      <ProgressBar
        value={(progress.totalXp - start) / (next - start)}
        accessibilityLabel="Level progress"
      />

      <View style={styles.stats}>
        <Stat label="Total XP" value={progress.totalXp} />
        <Stat label="Sessions" value={progress.sessions} />
        <Stat label="Minutes" value={progress.totalMinutes} />
      </View>

      <DayTracker done={periodsToday(progress)} />

      <AppText variant="heading">History</AppText>
      {progress.history.length === 0 ? (
        <AppText color={colors.textMuted}>
          No meditations yet. Your sessions will appear here.
        </AppText>
      ) : (
        <View style={styles.list} testID="history-list">
          {progress.history.map((s) => (
            <HistoryRow key={s.id} session={s} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

function HistoryRow({ session }: { session: SessionRecord }) {
  const { colors } = useTheme();
  const theme = THEMES.find((t) => t.id === session.themeId)?.label ?? 'Meditation';
  const when = formatSessionDate(new Date(session.endedAt));
  const length = formatSessionLength(session.completed, session.plannedMinutes, session.listenedMs);
  return (
    <View
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      accessible
      accessibilityLabel={`${when}. ${theme}, ${length}${session.completed ? '' : ', ended early'}. ${session.xp} XP.`}
    >
      <Ionicons name={PERIOD_ICONS[session.period]} size={22} color={colors.primary} />
      <View style={styles.rowText}>
        <AppText variant="label">{theme}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {when} · {length}
          {session.completed ? '' : ' · ended early'}
        </AppText>
      </View>
      <AppText variant="label" color={colors.accent}>
        +{session.xp} XP
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
});
