import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Avatar,
  BackButton,
  ChunkyButton,
  DayTracker,
  ProgressBar,
  Screen,
  Sheet,
  HeaderRow,
} from '@/components';
import type { IconName } from '@/components';
import { MUSIC, THEMES, VOICES } from '@/content/manifest';
import { formatSessionDate, formatSessionLength } from '@/domain/format';
import { levelForXp, xpToReachLevel } from '@/domain/progress';
import { useReplay } from '@/hooks/useReplay';
import { useActiveProfile } from '@/state/profiles';
import { periodsToday, useProfileProgress, type SessionRecord } from '@/state/progress';
import type { SetupStep } from '@/state/sessionSetup';
import { radius, spacing, useTheme, type TimeOfDay, useGlass } from '@/theme';

const PERIOD_NAMES: Record<TimeOfDay, string> = {
  morning: 'Morning',
  noon: 'Noon',
  night: 'Night',
};

const STEP_NAMES: Record<SetupStep, string> = {
  theme: 'Theme',
  voice: 'Narrator',
  music: 'Music',
  duration: 'Time',
};

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
  const replay = useReplay();
  const [details, setDetails] = useState<SessionRecord | null>(null);

  if (!profile) return <Redirect href="/" />;

  const level = levelForXp(progress.totalXp);
  const start = xpToReachLevel(level);
  const next = xpToReachLevel(level + 1);

  return (
    <Screen>
      <HeaderRow style={styles.header}>
        <BackButton />
        <Avatar avatar={profile.avatar} size={48} />
        <View style={styles.headerText}>
          <AppText variant="heading">{profile.name}</AppText>
          <AppText variant="caption" color={colors.accent}>
            Level {level} · {progress.totalXp - start} / {next - start} XP to level {level + 1}
          </AppText>
        </View>
      </HeaderRow>
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
            <HistoryRow
              key={s.id}
              session={s}
              onPlay={() => replay.play(s)}
              onDetails={() => setDetails(s)}
            />
          ))}
        </View>
      )}

      <Sheet visible={details !== null} onClose={() => setDetails(null)}>
        {details ? (
          <SessionDetails
            session={details}
            onPlay={() => {
              setDetails(null);
              replay.play(details);
            }}
            onClose={() => setDetails(null)}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { colors } = useTheme();
  const glass = useGlass();
  return (
    <View style={[styles.stat, glass.card]}>
      <AppText variant="heading">{value}</AppText>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

/** Labels of a past session's choices, and how "Play again" would go today. */
function useSessionInfo(session: SessionRecord) {
  const replay = useReplay();
  const plan = replay.planFor(session);
  const theme = THEMES.find((t) => t.id === session.themeId)?.label ?? 'Meditation';
  const narrator = VOICES.find((v) => v.id === plan.selection.voice)?.label ?? '';
  const music = MUSIC.find((m) => m.id === plan.selection.music)?.label ?? '';
  const minutes = plan.selection.duration;
  const lockedName = plan.lockedStep ? STEP_NAMES[plan.lockedStep] : null;
  const playLabel =
    `Play again: ${theme}, ${narrator}, ${music}, ${minutes} minutes` +
    (lockedName ? `. ${lockedName} is locked now, choose another` : '');
  return { theme, narrator, music, minutes, locked: !!lockedName, lockedName, playLabel };
}

function HistoryRow({
  session,
  onPlay,
  onDetails,
}: {
  session: SessionRecord;
  onPlay: () => void;
  onDetails: () => void;
}) {
  const { colors } = useTheme();
  const glass = useGlass();
  const info = useSessionInfo(session);
  const when = formatSessionDate(new Date(session.endedAt));
  const length = formatSessionLength(session.completed, session.plannedMinutes, session.listenedMs);
  return (
    <View style={[styles.row, glass.card]}>
      <Pressable
        onPress={onDetails}
        accessibilityRole="button"
        accessibilityLabel={`${when}. ${info.theme}, ${length}${session.completed ? '' : ', ended early'}. ${session.xp} XP.`}
        accessibilityHint="Shows the details"
        style={styles.rowMain}
      >
        <Ionicons name={PERIOD_ICONS[session.period]} size={22} color={colors.primary} />
        <View style={styles.rowText}>
          <AppText variant="label">{info.theme}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {when} · {length}
            {session.completed ? '' : ' · ended early'}
          </AppText>
        </View>
        <AppText variant="label" color={colors.accent}>
          +{session.xp} XP
        </AppText>
      </Pressable>
      <Pressable
        onPress={onPlay}
        accessibilityRole="button"
        accessibilityLabel={info.playLabel}
        hitSlop={8}
        style={({ pressed }) => [
          styles.play,
          {
            backgroundColor: info.locked ? colors.track : colors.glassButton,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
      >
        <Ionicons
          name={info.locked ? 'lock-closed' : 'play'}
          size={18}
          color={info.locked ? colors.textMuted : colors.onPrimary}
        />
      </Pressable>
    </View>
  );
}

function SessionDetails({
  session,
  onPlay,
  onClose,
}: {
  session: SessionRecord;
  onPlay: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const info = useSessionInfo(session);
  const when = formatSessionDate(new Date(session.endedAt));
  const listened = Math.floor(session.listenedMs / 60000);
  const rows: [string, string][] = [
    ['Time of day', PERIOD_NAMES[session.period]],
    ['Narrator', info.narrator],
    ['Music', info.music],
    ['Length', `${info.minutes} min`],
    [
      'Listened',
      session.completed ? 'The whole session' : listened > 0 ? `${listened} min` : 'Under a minute',
    ],
    ['XP earned', `+${session.xp} XP`],
  ];
  return (
    <>
      <View style={styles.detailsHead}>
        <AppText variant="title">{info.theme}</AppText>
        <AppText color={colors.textMuted}>{when}</AppText>
      </View>
      <View style={styles.detailsRows} testID="session-details">
        {rows.map(([label, value]) => (
          <View key={label} style={styles.detailsRow}>
            <AppText color={colors.textMuted}>{label}</AppText>
            <AppText variant="label">{value}</AppText>
          </View>
        ))}
      </View>
      {info.locked ? (
        <AppText variant="caption" color={colors.textMuted}>
          {info.lockedName} is locked now. Play again opens it so you can choose another.
        </AppText>
      ) : null}
      <ChunkyButton title="Play again" onPress={onPlay} />
      <ChunkyButton title="Close" variant="secondary" onPress={onClose} />
    </>
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
    gap: spacing.sm,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsHead: { gap: 2 },
  detailsRows: { gap: spacing.sm },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
});
