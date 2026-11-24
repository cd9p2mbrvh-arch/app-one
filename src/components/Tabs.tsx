import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

export type TabItem<K extends string> = {
  key: K;
  label: string;
  /** Shows a tick, e.g. when that step has been completed. */
  done?: boolean;
};

type Props<K extends string> = {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
};

/** A row of pill-shaped tabs. The active tab is filled; completed tabs show a tick. */
export function Tabs<K extends string>({ tabs, active, onChange }: Props<K>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const fg = isActive ? colors.onPrimary : colors.text;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.done ? `${tab.label}, done` : tab.label}
            accessibilityState={{ selected: isActive }}
            testID={`tab-${tab.key}`}
            style={[styles.tab, isActive && { backgroundColor: colors.primary }]}
          >
            {tab.done ? <Ionicons name="checkmark-circle" size={14} color={fg} /> : null}
            <AppText variant="caption" color={fg} style={styles.label} numberOfLines={1}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  label: { fontFamily: 'Nunito_800ExtraBold' },
});
