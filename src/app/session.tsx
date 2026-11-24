import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, ChunkyButton, Screen } from '@/components';
import { MUSIC, THEMES, VOICES } from '@/content/catalog';
import { useSessionSetup } from '@/state/sessionSetup';
import { spacing, useTheme } from '@/theme';

// Placeholder until the session player is built (M7).
export default function SessionScreen() {
  const { colors } = useTheme();
  const { theme, voice, music, duration } = useSessionSetup();
  const label = (list: { id: string; label: string }[], id: string | null) =>
    list.find((x) => x.id === id)?.label ?? '—';

  return (
    <Screen footer={<ChunkyButton title="Back to home" onPress={() => router.dismissAll()} />}>
      <AppText variant="title">Ready</AppText>
      <View style={styles.summary}>
        <AppText>Theme: {label(THEMES, theme)}</AppText>
        <AppText>Voice: {label(VOICES, voice)}</AppText>
        <AppText>Music: {label(MUSIC, music)}</AppText>
        <AppText>Time: {duration ?? '—'} min</AppText>
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        The session player arrives in a later milestone.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.sm },
});
