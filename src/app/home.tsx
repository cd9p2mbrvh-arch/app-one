import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Avatar, ChunkyButton, ProgressBar, Screen, Tabs } from '@/components';
import { useActiveProfile } from '@/state/profiles';
import { spacing, useTheme, type TimeOfDay } from '@/theme';

type PreviewKey = 'auto' | TimeOfDay;

const PREVIEW_TABS: { key: PreviewKey; label: string }[] = [
  { key: 'auto', label: 'Auto' },
  { key: 'morning', label: 'Morning' },
  { key: 'noon', label: 'Noon' },
  { key: 'night', label: 'Night' },
];

export default function HomeScreen() {
  const { colors, override, setOverride } = useTheme();
  const profile = useActiveProfile();

  if (!profile) return <Redirect href="/" />;

  return (
    <Screen
      footer={
        <>
          <ChunkyButton title="Start session" onPress={() => router.push('/setup')} />
          <ChunkyButton
            title="Switch profile"
            variant="secondary"
            onPress={() => router.push('/profiles')}
          />
        </>
      }
    >
      <View style={styles.greeting}>
        <Avatar avatar={profile.avatar} />
        <View style={styles.greetingText}>
          <AppText variant="caption" color={colors.textMuted}>
            Welcome back
          </AppText>
          <AppText variant="title" numberOfLines={1}>
            Hi, {profile.name}
          </AppText>
        </View>
      </View>

      {/* Placeholder numbers until XP is implemented (M9). */}
      <View style={styles.block}>
        <View style={styles.levelRow}>
          <AppText variant="label">Level 1</AppText>
          <AppText variant="label" color={colors.accent}>
            0 / 100 XP
          </AppText>
        </View>
        <ProgressBar value={0} accessibilityLabel="Level progress" />
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
  greeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  greetingText: { flex: 1 },
  block: { gap: spacing.sm },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
