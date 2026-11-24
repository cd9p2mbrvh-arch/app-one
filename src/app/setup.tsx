import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import {
  AppText,
  ChunkyButton,
  OptionCard,
  Screen,
  Tabs,
  type IconName,
  type TabItem,
} from '@/components';
import { DURATION_PRESETS_MIN, MUSIC, THEMES, VOICES } from '@/content/catalog';
import {
  isSetupComplete,
  isStepDone,
  nextStepAfter,
  SETUP_STEPS,
  useSessionSetup,
  type SetupSelection,
  type SetupStep,
} from '@/state/sessionSetup';
import { spacing, useTheme } from '@/theme';

const STEP_LABELS: Record<SetupStep, string> = {
  theme: 'Theme',
  voice: 'Voice',
  music: 'Music',
  duration: 'Time',
};

const STEP_TITLES: Record<SetupStep, string> = {
  theme: 'Choose a theme',
  voice: 'Choose a voice',
  music: 'Choose background music',
  duration: 'How long?',
};

type Option = { value: string | number; label: string; icon?: IconName };

const OPTIONS: Record<SetupStep, Option[]> = {
  theme: THEMES.map((t) => ({ value: t.id, label: t.label, icon: t.icon })),
  voice: VOICES.map((v) => ({ value: v.id, label: v.label, icon: v.icon })),
  music: MUSIC.map((m) => ({ value: m.id, label: m.label, icon: m.icon })),
  duration: DURATION_PRESETS_MIN.map((min) => ({ value: min, label: `${min} min` })),
};

export default function SetupScreen() {
  const { colors } = useTheme();
  const selection: SetupSelection = useSessionSetup(
    useShallow((s) => ({ theme: s.theme, voice: s.voice, music: s.music, duration: s.duration })),
  );
  const choose = useSessionSetup((s) => s.choose);
  const [active, setActive] = useState<SetupStep>('theme');

  const tabs: TabItem<SetupStep>[] = SETUP_STEPS.map((step) => ({
    key: step,
    label: STEP_LABELS[step],
    done: isStepDone(selection, step),
  }));

  const onChoose = (value: string | number) => {
    choose(active, value as never);
    setActive(nextStepAfter({ ...selection, [active]: value }, active));
  };

  const options = OPTIONS[active];
  const rows: Option[][] = [];
  for (let i = 0; i < options.length; i += 2) rows.push(options.slice(i, i + 2));

  return (
    <Screen
      footer={
        <ChunkyButton
          title="Begin"
          disabled={!isSetupComplete(selection)}
          onPress={() => router.push('/session')}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <AppText variant="heading">New session</AppText>
      </View>

      <Tabs tabs={tabs} active={active} onChange={setActive} />

      <AppText variant="title">{STEP_TITLES[active]}</AppText>

      <View style={styles.grid}>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((opt) => (
              <OptionCard
                key={opt.value}
                label={opt.label}
                icon={opt.icon}
                selected={selection[active] === opt.value}
                onPress={() => onChoose(opt.value)}
              />
            ))}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  spacer: { flex: 1 },
});
