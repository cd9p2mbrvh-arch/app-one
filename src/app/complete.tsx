import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { AppText, ChunkyButton, DayTracker, Screen } from '@/components';
import { MUSIC, THEMES, VOICES } from '@/content/manifest';
import { xpToReachLevel } from '@/domain/progress';
import { useReplay } from '@/hooks/useReplay';
import { useActiveProfile } from '@/state/profiles';
import { useProfileProgress } from '@/state/progress';
import { radius, spacing, useTheme, useGlass } from '@/theme';

/** Fraction of the way through `level` for an XP total. */
function levelFraction(xp: number, level: number) {
  const start = xpToReachLevel(level);
  return (xp - start) / (xpToReachLevel(level + 1) - start);
}

/** After a session: XP earned, the level bar filling up, and any level-up. */
export default function CompleteScreen() {
  const { colors } = useTheme();
  const glass = useGlass();
  const profile = useActiveProfile();
  const progress = useProfileProgress(profile?.id);
  const result = progress.lastResult;
  // The session just finished is the newest history entry.
  const justFinished = progress.history[0];
  const replay = useReplay();
  const [fill] = useState(() => new Animated.Value(0));
  const [shownLevel, setShownLevel] = useState(result?.levelBefore ?? 1);
  const [celebrate] = useState(() => new Animated.Value(0));

  const leveledUp = !!result && result.levelAfter > result.levelBefore;

  useEffect(() => {
    if (!result) return;
    fill.setValue(levelFraction(result.xpBefore, result.levelBefore));
    const toEnd = Animated.timing(fill, {
      toValue: leveledUp ? 1 : levelFraction(result.xpAfter, result.levelAfter),
      duration: 1200,
      delay: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    toEnd.start(({ finished }) => {
      if (!finished || !leveledUp) return;
      setShownLevel(result.levelAfter);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      fill.setValue(0);
      Animated.parallel([
        Animated.timing(fill, {
          toValue: levelFraction(result.xpAfter, result.levelAfter),
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.spring(celebrate, { toValue: 1, friction: 4, useNativeDriver: false }),
      ]).start();
    });
    return () => toEnd.stop();
  }, [result, leveledUp, fill, celebrate]);

  if (!profile) return <Redirect href="/" />;
  if (!result) return <Redirect href="/home" />;

  const minutes = Math.floor(result.listenedMs / 60000);
  const theme = THEMES.find((t) => t.id === result.themeId);
  const unlocked = [...VOICES, ...MUSIC].filter(
    (item) =>
      !item.purchase &&
      item.unlockLevel > result.levelBefore &&
      item.unlockLevel <= result.levelAfter,
  );
  const rows: [string, number][] = [
    [
      result.completed ? `${result.plannedMinutes} minutes` : `${minutes} full minutes`,
      result.xp.minutesXp,
    ],
    ['Completion bonus', result.xp.completionBonus],
    ['First session today', result.xp.dailyBonus],
    ['Morning, noon and night', result.xp.allPeriodsBonus ?? 0],
  ];

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          {justFinished ? (
            <ChunkyButton
              title="Play again"
              variant="secondary"
              onPress={() => replay.play(justFinished)}
            />
          ) : null}
          <ChunkyButton title="Done" onPress={() => router.dismissTo('/home')} />
        </View>
      }
    >
      <View style={styles.top}>
        <Ionicons
          name={result.completed ? 'sparkles' : 'leaf-outline'}
          size={48}
          color={colors.primary}
        />
        <AppText variant="title" style={styles.center}>
          {result.completed ? `Well done, ${profile.name}` : 'Session ended'}
        </AppText>
        <AppText color={colors.textMuted} style={styles.center}>
          {minutes > 0 ? `${minutes} min of ${theme?.label ?? 'meditation'}` : 'Less than a minute'}
        </AppText>
      </View>

      <View style={[styles.card, glass.card]}>
        {result.xp.total > 0 ? (
          rows
            .filter(([, xp]) => xp > 0)
            .map(([label, xp]) => (
              <View key={label} style={styles.row}>
                <AppText>{label}</AppText>
                <AppText variant="label" color={colors.accent}>
                  +{xp} XP
                </AppText>
              </View>
            ))
        ) : (
          <AppText color={colors.textMuted}>Sessions shorter than a minute do not earn XP.</AppText>
        )}
        <View style={[styles.row, styles.total, { borderTopColor: colors.border }]}>
          <AppText variant="heading">Total</AppText>
          <AppText variant="heading" testID="xp-total">
            +{result.xp.total} XP
          </AppText>
        </View>
      </View>

      <View style={styles.level}>
        <View style={styles.row}>
          <AppText variant="label" testID="level-label">
            Level {shownLevel}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {result.xpAfter} XP
          </AppText>
        </View>
        <View style={[styles.track, { backgroundColor: colors.track }]}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: colors.primary,
                width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              },
            ]}
          />
        </View>
      </View>

      <DayTracker done={result.periodsToday ?? []} />

      {leveledUp ? (
        <Animated.View
          style={[
            styles.levelUp,
            {
              backgroundColor: colors.primary,
              opacity: celebrate,
              transform: [
                { scale: celebrate.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
              ],
            },
          ]}
        >
          <AppText variant="heading" color={colors.onPrimary} style={styles.center}>
            Level up! You are now level {result.levelAfter}
          </AppText>
          {unlocked.length > 0 ? (
            <AppText color={colors.onPrimary} style={styles.center}>
              New: {unlocked.map((i) => i.label).join(', ')}
            </AppText>
          ) : null}
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { gap: spacing.sm },
  top: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  center: { textAlign: 'center' },
  card: { borderWidth: 2, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { borderTopWidth: 1, paddingTop: spacing.sm, marginTop: spacing.xs },
  level: { gap: spacing.sm },
  track: { height: 16, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  levelUp: { borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
});
