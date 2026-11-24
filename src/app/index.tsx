import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, ChunkyButton, ProgressBar, Screen, Tabs } from '@/components';
import { spacing, useTheme, type TimeOfDay } from '@/theme';

// Temporary home screen. The real Home arrives with profiles (M2) and XP (M9).

type PreviewKey = 'auto' | TimeOfDay;

const PREVIEW_TABS: { key: PreviewKey; label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: 'morning', label: 'Morning' },
  { key: 'noon', label: 'Noon' },
  { key: 'night', label: 'Night' },
];

export default function HomeScreen() {
  const { colors, override, setOverride } = useTheme();

  return (
    <Screen
      footer={
        <>
          <ChunkyButton title="Start session" onPress={() => router.push('/setup')} />
          <ChunkyButton title="Switch profile" variant="secondary" onPress={() => {}} />
        </>
      }
    >
      <AppText variant="title">App One</AppText>

      <View style={styles.block}>
        <View style={styles.levelRow}>
          <AppText variant="label">Level 3</AppText>
          <AppText variant="label" color={colors.accent}>
            124 / 200 XP
          </AppText>
        </View>
        <ProgressBar value={124 / 200} accessibilityLabel="Level progress" />
      </View>

      <View style={styles.block}>
        <AppText variant="caption" color={colors.textMuted}>
          Background preview (temporary, for testing)
        </AppText>
        <Tabs
          tabs={PREVIEW_TABS}
          active={override ?? 'auto'}
          onChange={(key) => setOverride(key === 'auto' ? null : key)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
