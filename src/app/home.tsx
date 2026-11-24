import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  AppText,
  Avatar,
  ChunkyButton,
  ProgressBar,
  RotaryWheel,
  Screen,
  Tabs,
  type WheelItem,
} from '@/components';
import { MusicList, NarratorSelect, ThemeGrid } from '@/components/setup';
import { DURATIONS_MIN, MUSIC, THEMES, VOICES } from '@/content/manifest';
import { levelForXp, xpToReachLevel } from '@/domain/progress';
import { useActiveProfile } from '@/state/profiles';
import {
  canBegin,
  isStepLocked,
  SETUP_STEPS,
  useSessionSetup,
  type SetupSelection,
  type SetupStep,
} from '@/state/sessionSetup';
import { spacing, useTheme, type TimeOfDay } from '@/theme';

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

const DURATION_ITEMS: WheelItem[] = DURATIONS_MIN.map((min) => ({
  key: String(min),
  label: `${min} minutes`,
  text: String(min),
}));

/** Main screen: pick theme, voice, music and duration on rotating wheels. */
export default function HomeScreen() {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const profile = useActiveProfile();
  const selection: SetupSelection = useSessionSetup(
    useShallow((s) => ({ theme: s.theme, voice: s.voice, music: s.music, duration: s.duration })),
  );
  const choose = useSessionSetup((s) => s.choose);
  const [active, setActive] = useState<SetupStep>('theme');

  if (!profile) return <Redirect href="/" />;

  // XP tracking arrives with the XP milestone; every profile is level 1 until then.
  const xp = 0;
  const level = levelForXp(xp);
  const levelStart = xpToReachLevel(level);
  const levelProgress = (xp - levelStart) / (xpToReachLevel(level + 1) - levelStart);

  const stepIndex = SETUP_STEPS.indexOf(active);
  const isLast = stepIndex === SETUP_STEPS.length - 1;
  const locked = isStepLocked(selection, active, level);
  const wheelSize = Math.min(width - spacing.lg * 2, height * 0.42, 340);
  const isWheel = active === 'duration';

  const primaryTitle = locked ? 'Locked' : isLast ? 'Begin' : 'Next';
  const lockedStep = SETUP_STEPS.find((step) => isStepLocked(selection, step, level));
  const blockedHint =
    isLast && lockedStep && !locked
      ? `Your ${STEP_LABELS[lockedStep].toLowerCase()} choice is locked. Pick another to begin.`
      : null;
  const onPrimary = () => {
    if (isLast) router.push('/session');
    else setActive(SETUP_STEPS[stepIndex + 1]);
  };

  return (
    <Screen
      scroll={!isWheel}
      footer={
        <>
          {blockedHint ? (
            <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
              {blockedHint}
            </AppText>
          ) : null}
          <ChunkyButton
            title={primaryTitle}
            disabled={locked || (isLast && !canBegin(selection, level))}
            onPress={onPrimary}
          />
        </>
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/profiles')}
          accessibilityRole="button"
          accessibilityLabel={`Switch profile, currently ${profile.name}`}
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
                <ProgressBar value={levelProgress} height={8} accessibilityLabel="Level progress" />
              </View>
            </View>
          </View>
          <Ionicons name="swap-horizontal" size={20} color={colors.textMuted} />
        </Pressable>
        <BackgroundPreviewButton />
      </View>

      <Tabs
        tabs={SETUP_STEPS.map((step) => ({ key: step, label: STEP_LABELS[step] }))}
        active={active}
        onChange={setActive}
      />

      <AppText variant="title" style={styles.title}>
        {STEP_TITLES[active]}
      </AppText>

      {active === 'theme' ? (
        <ThemeGrid
          themes={THEMES}
          selectedId={selection.theme}
          onSelect={(id) => choose('theme', id)}
        />
      ) : null}

      {active === 'voice' ? (
        <NarratorSelect
          narrators={VOICES}
          selectedId={selection.voice}
          level={level}
          onSelect={(id) => choose('voice', id)}
        />
      ) : null}

      {active === 'music' ? (
        <MusicList
          tracks={MUSIC}
          selectedId={selection.music}
          level={level}
          onSelect={(id) => choose('music', id)}
        />
      ) : null}

      {isWheel ? (
        <View style={styles.wheelArea}>
          <RotaryWheel
            items={DURATION_ITEMS}
            selectedIndex={Math.max(0, DURATIONS_MIN.indexOf(selection.duration))}
            onChange={(i) => choose('duration', DURATIONS_MIN[i])}
            accessibilityLabel="Time"
            size={wheelSize}
            testID="wheel"
            renderCenter={(item) => <DurationCenter item={item} />}
          />
          <AppText variant="caption" color={colors.textMuted}>
            Turn the wheel or tap a number
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

function DurationCenter({ item }: { item: WheelItem }) {
  const { colors } = useTheme();
  return (
    <>
      <AppText variant="title" style={styles.bigNumber}>
        {item.text}
      </AppText>
      <AppText variant="label" color={colors.textMuted}>
        minutes
      </AppText>
    </>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profileText: { flex: 1, gap: 2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  levelBar: { flex: 1, maxWidth: 120 },
  title: { textAlign: 'center' },
  hint: { textAlign: 'center' },
  wheelArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  bigNumber: { fontSize: 56, lineHeight: 62 },
  previewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
