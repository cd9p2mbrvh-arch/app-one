import { useKeepAwake } from 'expo-keep-awake';
import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { AppText, BreathingCircle, ChunkyButton, Screen, Sheet } from '@/components';
import { linesFor } from '@/content/lines';
import { MUSIC, THEMES, VOICES } from '@/content/manifest';
import { formatClock } from '@/domain/format';
import { meditationDay, sessionXp } from '@/domain/xp';
import { tap } from '@/feedback';
import { useSession } from '@/session/useSession';
import { useActiveProfile } from '@/state/profiles';
import { useProfileProgress, useProgress } from '@/state/progress';
import { resolveSelection, useSessionSetup } from '@/state/sessionSetup';
import { spacing, useTheme } from '@/theme';

/** The meditation itself: scene, breathing circle, time left, words, pause and end. */
export default function SessionScreen() {
  // Keep the screen on for the whole session.
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const profile = useActiveProfile();
  const progress = useProfileProgress(profile?.id);
  const recordSession = useProgress((s) => s.recordSession);
  const selection = resolveSelection(
    useSessionSetup(
      useShallow((s) => ({ theme: s.theme, voice: s.voice, music: s.music, duration: s.duration })),
    ),
  );
  const [confirmEnd, setConfirmEnd] = useState(false);

  const narratorIndex = Math.max(
    0,
    VOICES.findIndex((v) => v.id === selection.voice),
  );
  const narrator = VOICES[narratorIndex];
  const track = MUSIC.find((m) => m.id === selection.music) ?? MUSIC[0];
  const theme = THEMES.find((t) => t.id === selection.theme);
  const lines = useMemo(
    () => linesFor(selection.theme, selection.voice),
    [selection.theme, selection.voice],
  );

  const { state, pause, resume, end, audioCheck } = useSession({
    themeId: selection.theme,
    lines,
    nowPlaying: { title: theme?.label ?? 'Meditation', artist: narrator.label },
    durationMs: selection.duration * 60000,
    narrator,
    musicSource: track.source,
    onFinish: (s) => {
      if (profile) {
        recordSession(profile.id, {
          completed: !!s.completed,
          plannedMinutes: selection.duration,
          listenedMs: s.elapsedMs,
          themeId: selection.theme,
          voiceId: selection.voice,
          musicId: selection.music,
        });
      }
      router.replace('/complete');
    },
  });

  if (!profile) return <Redirect href="/" />;

  const paused = state.status === 'paused';
  const remaining = state.durationMs - state.elapsedMs;
  const xpIfEnded = sessionXp({
    plannedMinutes: selection.duration,
    listenedMs: state.elapsedMs,
    completed: false,
    firstToday: progress.lastXpDay !== meditationDay(new Date()),
  }).total;

  const openEnd = () => {
    tap();
    pause();
    setConfirmEnd(true);
  };

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <ChunkyButton
            title={paused ? 'Resume' : 'Pause'}
            variant="secondary"
            onPress={() => {
              tap();
              if (paused) resume();
              else pause();
            }}
          />
          <Pressable
            onPress={openEnd}
            accessibilityRole="button"
            accessibilityLabel="End session"
            hitSlop={8}
            style={styles.endLink}
          >
            <AppText variant="label" color={colors.textMuted}>
              End session
            </AppText>
          </Pressable>
          {/* TEMPORARY: helps find why audio stops with the screen locked. */}
          <AppText
            variant="caption"
            color={colors.textMuted}
            style={styles.centerText}
            testID="audio-check"
          >
            {audioCheck}
          </AppText>
        </>
      }
    >
      <AppText variant="label" color={colors.textMuted} style={[styles.centerText, styles.heading]}>
        {theme?.label} · {narrator.label}
      </AppText>

      <View style={styles.middle}>
        <BreathingCircle size={Math.min(width * 0.72, 300)} running={state.status === 'playing'}>
          <AppText
            variant="title"
            style={styles.clock}
            accessibilityLabel={`${formatClock(remaining)} left`}
            testID="time-left"
          >
            {formatClock(remaining)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            left
          </AppText>
        </BreathingCircle>

        <Subtitle text={state.currentLine} />
      </View>

      <Sheet
        visible={confirmEnd}
        onClose={() => {
          setConfirmEnd(false);
          resume();
        }}
      >
        <AppText variant="title">End this session?</AppText>
        <AppText color={colors.textMuted}>
          {xpIfEnded > 0
            ? `You'll get ${xpIfEnded} XP for the time so far. Finishing the session gives more.`
            : 'Sessions shorter than a minute do not earn XP.'}
        </AppText>
        <ChunkyButton
          title="Keep going"
          onPress={() => {
            setConfirmEnd(false);
            resume();
          }}
        />
        <ChunkyButton
          title="End now"
          variant="secondary"
          onPress={() => {
            setConfirmEnd(false);
            end();
          }}
        />
      </Sheet>
    </Screen>
  );
}

/** The words being spoken, fading in gently. */
function Subtitle({ text }: { text: string | null }) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    opacity.setValue(0);
    if (text) {
      Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    }
  }, [text, opacity]);
  return (
    <Animated.View style={[styles.subtitle, { opacity }]} accessibilityLiveRegion="polite">
      {text ? (
        <AppText variant="heading" style={styles.centerText} testID="subtitle">
          {text}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  clock: { fontSize: 44, lineHeight: 50 },
  centerText: { textAlign: 'center' },
  // Below the header row, where the night scene's moon sits.
  heading: { marginTop: spacing.xl + spacing.lg },
  subtitle: { minHeight: 64, paddingHorizontal: spacing.md, justifyContent: 'center' },
  endLink: { alignSelf: 'center', paddingVertical: spacing.xs },
});
