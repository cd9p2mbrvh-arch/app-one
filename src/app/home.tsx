import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  AppText,
  Avatar,
  ChunkyButton,
  DurationDial,
  TimeWheel,
  ProgressBar,
  Screen,
  Tabs,
  HeaderRow,
} from '@/components';
import {
  MusicCards,
  MusicListClassic,
  NarratorSelect,
  ThemeFixedChoice,
  ThemeGrid,
} from '@/components/setup';
import { MUSIC, THEMES, VOICES } from '@/content/manifest';
import { levelForXp, xpToReachLevel } from '@/domain/progress';
import { tap } from '@/feedback';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useActiveProfile } from '@/state/profiles';
import { useProfileProgress } from '@/state/progress';
import { useOwned } from '@/state/purchases';
import {
  canBegin,
  chosenItem,
  isStepFixed,
  isStepLocked,
  resolveSelection,
  SETUP_STEPS,
  useSessionSetup,
  type SetupSelection,
  type SetupStep,
} from '@/state/sessionSetup';
import { spacing, useTheme, type TimeOfDay } from '@/theme';

/**
 * Which picker the Time tab shows. 'rotatingWheel' = the whole wheel turns under a
 * fixed top marker (current design). 'clockDial' = the earlier clock face with a
 * draggable knob. Change this one line to switch back.
 */
const TIME_PICKER: 'rotatingWheel' | 'clockDial' = 'rotatingWheel';

/**
 * Which design the Music tab uses. 'cards' = soft 3D cards in two columns with
 * filter chips and a mini player (experiment, current). 'classic' = the earlier
 * list of rows. Change this one line to switch back.
 */
const MUSIC_STYLE: 'cards' | 'classic' = 'cards';
const MusicPicker = MUSIC_STYLE === 'cards' ? MusicCards : MusicListClassic;

const STEP_LABELS: Record<SetupStep, string> = {
  theme: 'Theme',
  voice: 'Narrator',
  music: 'Music',
  duration: 'Time',
};

const STEP_TITLES: Record<SetupStep, string> = {
  theme: 'Choose a theme',
  voice: 'Choose your narrator',
  music: 'Choose music',
  duration: 'How long?',
};

/** Main screen: pick theme, voice, music and duration on rotating wheels. */
export default function HomeScreen() {
  const { colors, backdrop } = useTheme();
  const reduceMotion = useReduceMotion();
  // 0 = screen shown, 1 = zoomed in and faded into the blur (leaving for the session).
  const [leaving] = useState(() => new Animated.Value(0));
  const isLeaving = useRef(false);

  // Coming back from the session: show the screen again.
  useFocusEffect(
    useCallback(() => {
      leaving.setValue(0);
      isLeaving.current = false;
    }, [leaving]),
  );

  const begin = () => {
    if (isLeaving.current) return;
    isLeaving.current = true;
    tap();
    if (reduceMotion) {
      router.push('/session');
      return;
    }
    Animated.timing(leaving, {
      toValue: 1,
      duration: 650,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => router.push('/session'));
  };
  const { width, height } = useWindowDimensions();
  const profile = useActiveProfile();
  const owned = useOwned();
  const progress = useProfileProgress(profile?.id);
  const selection: SetupSelection = useSessionSetup(
    useShallow((s) => ({ theme: s.theme, voice: s.voice, music: s.music, duration: s.duration })),
  );
  const choose = useSessionSetup((s) => s.choose);
  const [active, setActive] = useState<SetupStep>('theme');
  const [slide] = useState(() => new Animated.Value(0));
  const direction = useRef<1 | -1 | 0>(0);

  /** Switches tab with a slide from the direction of travel and a haptic. */
  const goTo = (step: SetupStep) => {
    if (step === active) return;
    direction.current = SETUP_STEPS.indexOf(step) > SETUP_STEPS.indexOf(active) ? 1 : -1;
    setActive(step);
    tap();
  };

  // Start the slide once the new tab's content is mounted. (Some tabs use a
  // different layout, so the content view can be re-created; an animation
  // started before that would stay attached to the old view.)
  useEffect(() => {
    if (direction.current === 0) return;
    slide.setValue(direction.current);
    direction.current = 0;
    Animated.timing(slide, {
      toValue: 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      // A single small view: the JS driver is plenty fast and keeps the end
      // state observable (and testable).
      useNativeDriver: false,
    }).start();
  }, [active, slide]);

  if (!profile) return <Redirect href="/" />;

  const xp = progress.totalXp;
  const level = levelForXp(xp);
  const levelStart = xpToReachLevel(level);
  const levelProgress = (xp - levelStart) / (xpToReachLevel(level + 1) - levelStart);

  const stepIndex = SETUP_STEPS.indexOf(active);
  const isLast = stepIndex === SETUP_STEPS.length - 1;
  const locked = isStepLocked(selection, active, level, owned);
  const dialSize = Math.min(width - spacing.lg * 2, height * 0.45, 340);
  const isDial = active === 'duration';

  const primaryTitle = locked ? 'Locked' : isLast ? 'Begin' : 'Next';
  const lockedStep = SETUP_STEPS.find((step) => isStepLocked(selection, step, level, owned));
  const blockedHint =
    isLast && lockedStep && !locked
      ? `Your ${STEP_LABELS[lockedStep].toLowerCase()} choice is locked. Pick another to begin.`
      : null;
  const onPrimary = () => {
    if (isLast) begin();
    else goTo(SETUP_STEPS[stepIndex + 1]);
  };

  return (
    <View style={styles.root}>
      <Animated.View
        testID="setup-screen"
        style={[
          styles.root,
          {
            opacity: leaving.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              { scale: leaving.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
            ],
          },
        ]}
      >
        <Screen
          scroll={!isDial}
          footer={
            <>
              {blockedHint ? (
                <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                  {blockedHint}
                </AppText>
              ) : null}
              <ChunkyButton
                title={primaryTitle}
                disabled={locked || (isLast && !canBegin(selection, level, owned))}
                onPress={onPrimary}
              />
            </>
          }
        >
          <HeaderRow style={styles.header}>
            {/* Left side: the top-right corner is covered by Expo Go's floating gear. */}
            <BackgroundPreviewButton />
            <Pressable
              onPress={() => router.push('/history')}
              accessibilityRole="button"
              accessibilityLabel={`${profile.name}, level ${level}. Your progress and history`}
              style={styles.profile}
            >
              <Avatar avatar={profile.avatar} size={44} />
              <View style={styles.profileText}>
                <AppText variant="label" numberOfLines={1}>
                  {profile.name}
                </AppText>
                <View style={styles.levelRow}>
                  <AppText variant="caption" color={colors.accent}>
                    Level {level}
                  </AppText>
                  <View style={styles.levelBar}>
                    <ProgressBar
                      value={levelProgress}
                      height={8}
                      accessibilityLabel="Level progress"
                    />
                  </View>
                </View>
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.push('/profiles')}
              accessibilityRole="button"
              accessibilityLabel={`Switch profile, currently ${profile.name}`}
              hitSlop={10}
              style={styles.switchButton}
            >
              <Ionicons name="swap-horizontal" size={22} color={colors.textMuted} />
            </Pressable>
          </HeaderRow>

          <Tabs
            tabs={SETUP_STEPS.map((step) => ({ key: step, label: STEP_LABELS[step] }))}
            active={active}
            onChange={goTo}
          />

          <Animated.View
            testID="tab-content"
            style={[
              styles.content,
              isDial && styles.dialContent,
              {
                opacity: slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
                transform: [
                  {
                    translateX: slide.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-70, 0, 70],
                    }),
                  },
                ],
              },
            ]}
          >
            <AppText variant="title" style={styles.title}>
              {STEP_TITLES[active]}
            </AppText>

            {active === 'theme' && selection.theme === 'health' ? (
              <AppText
                variant="caption"
                color={colors.textMuted}
                style={styles.hint}
                testID="health-theme-note"
              >
                For relaxation and wellbeing, not medical advice. Talk to a doctor about health
                concerns.
              </AppText>
            ) : null}
            {active === 'theme' ? (
              <ThemeGrid
                themes={THEMES}
                selectedId={selection.theme}
                onSelect={(id) => choose('theme', id)}
              />
            ) : null}

            {active === 'voice' && isStepFixed(selection, 'voice') ? (
              <ThemeFixedChoice
                kind="narrator"
                itemLabel={chosenItem(selection, 'voice')?.label ?? ''}
                themeLabel={chosenItem(selection, 'theme')?.label ?? ''}
                accent={VOICES.find((v) => v.id === resolveSelection(selection).voice)?.accent}
              />
            ) : null}

            {active === 'voice' && !isStepFixed(selection, 'voice') ? (
              <NarratorSelect
                narrators={VOICES}
                selectedId={selection.voice}
                level={level}
                owned={owned}
                onSelect={(id) => choose('voice', id)}
              />
            ) : null}

            {active === 'music' && isStepFixed(selection, 'music') ? (
              <ThemeFixedChoice
                kind="music"
                itemLabel={chosenItem(selection, 'music')?.label ?? ''}
                themeLabel={chosenItem(selection, 'theme')?.label ?? ''}
                accent={MUSIC.find((m) => m.id === resolveSelection(selection).music)?.accent}
              />
            ) : null}

            {active === 'music' && !isStepFixed(selection, 'music') ? (
              <MusicPicker
                tracks={MUSIC}
                selectedId={selection.music}
                level={level}
                owned={owned}
                onSelect={(id) => choose('music', id)}
              />
            ) : null}

            {isDial ? (
              <View style={styles.dialArea}>
                {TIME_PICKER === 'rotatingWheel' ? (
                  <TimeWheel
                    value={selection.duration}
                    onChange={(minutes) => choose('duration', minutes)}
                    size={dialSize}
                    testID="dial"
                  />
                ) : (
                  <DurationDial
                    value={selection.duration}
                    onChange={(minutes) => choose('duration', minutes)}
                    size={dialSize}
                    testID="dial"
                  />
                )}
                <AppText variant="caption" color={colors.textMuted}>
                  {TIME_PICKER === 'rotatingWheel'
                    ? 'Turn the wheel or tap a number · clockwise adds time'
                    : 'Tap the dial or drag the knob · one circle = 60 minutes'}
                </AppText>
              </View>
            ) : null}
          </Animated.View>
        </Screen>
      </Animated.View>
      <Animated.View
        testID="begin-blur"
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: leaving }]}
      >
        <BlurView intensity={70} tint={backdrop.glass} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

// Temporary: cycles the time-of-day background so all looks can be previewed.
const PREVIEW_ORDER: (TimeOfDay | null)[] = [null, 'morning', 'noon', 'night'];
const PREVIEW_ICONS = {
  auto: 'time-outline',
  morning: 'partly-sunny-outline',
  noon: 'sunny-outline',
  night: 'moon-outline',
} as const;

function BackgroundPreviewButton() {
  const { colors, override, setOverride } = useTheme();
  const name = override ?? 'auto';
  const next = PREVIEW_ORDER[(PREVIEW_ORDER.indexOf(override) + 1) % PREVIEW_ORDER.length];
  return (
    <Pressable
      onPress={() => setOverride(next)}
      accessibilityRole="button"
      accessibilityLabel={`Background preview: ${name}`}
      hitSlop={8}
      style={[
        styles.previewButton,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      <Ionicons name={PREVIEW_ICONS[name]} size={20} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profileText: { flex: 1, gap: 2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelBar: { flex: 1, maxWidth: 120 },
  title: { textAlign: 'center' },
  hint: { textAlign: 'center' },
  content: { gap: spacing.lg },
  dialContent: { flex: 1 },
  dialArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  switchButton: { padding: spacing.xs },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
