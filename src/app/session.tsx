import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, ChunkyButton, Screen } from '@/components';
import { chosenItem, useSessionSetup } from '@/state/sessionSetup';
import { spacing, useTheme } from '@/theme';

// Placeholder until the session player is built.
export default function SessionScreen() {
  const { colors } = useTheme();
  const selection = useSessionSetup();

  return (
    <Screen footer={<ChunkyButton title="Back" onPress={() => router.dismissTo('/home')} />}>
      <AppText variant="title">Ready</AppText>
      <View style={styles.summary}>
        <AppText>Theme: {chosenItem(selection, 'theme')?.label}</AppText>
        <AppText>Narrator: {chosenItem(selection, 'voice')?.label}</AppText>
        <AppText>Music: {chosenItem(selection, 'music')?.label}</AppText>
        <AppText>Time: {selection.duration} min</AppText>
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
