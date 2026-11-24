import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  ChunkyButton,
  OptionCard,
  ProgressBar,
  Screen,
  type IconName,
} from '@/components';
import { colors, spacing } from '@/theme';

// Temporary home screen showcasing the design system.
// Replaced by the real Home once profiles (M2) and XP (M9) exist.
const THEMES: { id: string; label: string; icon: IconName }[] = [
  { id: 'abundance', label: 'Abundance', icon: 'sparkles-outline' },
  { id: 'peace', label: 'Peace of Mind', icon: 'cloud-outline' },
  { id: 'health', label: 'Health', icon: 'leaf-outline' },
  { id: 'gratitude', label: 'Gratitude', icon: 'heart-outline' },
];

export default function HomeScreen() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Screen>
      <AppText variant="title">App One</AppText>

      <View style={styles.levelRow}>
        <AppText variant="label">Level 3</AppText>
        <AppText variant="label" color={colors.accent}>
          124 / 200 XP
        </AppText>
      </View>
      <ProgressBar value={124 / 200} accessibilityLabel="Level progress" />

      <AppText variant="heading">Choose a theme</AppText>
      <View style={styles.grid}>
        {[THEMES.slice(0, 2), THEMES.slice(2)].map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((t) => (
              <OptionCard
                key={t.id}
                label={t.label}
                icon={t.icon}
                selected={selected === t.id}
                onPress={() => setSelected(t.id)}
                testID={`theme-${t.id}`}
              />
            ))}
          </View>
        ))}
      </View>

      <ChunkyButton title="Start session" onPress={() => {}} disabled={!selected} />
      <ChunkyButton title="Switch profile" variant="secondary" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: -spacing.sm },
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
});
