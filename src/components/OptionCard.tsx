import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, edge, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress: () => void;
  testID?: string;
};

/** A selectable tile (theme, voice, music…) with the same 3D press effect as buttons. */
export function OptionCard({ label, icon, selected, onPress, testID }: Props) {
  const edgeColor = selected ? colors.primaryEdge : colors.border;
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={styles.pressable}
    >
      {({ pressed }) => (
        <View style={[styles.edge, { backgroundColor: edgeColor }]}>
          <View
            style={[
              styles.face,
              { borderColor: selected ? colors.primary : colors.border },
              { transform: [{ translateY: pressed ? 0 : -edge.card }] },
            ]}
          >
            {icon ? <Ionicons name={icon} size={26} color={colors.primary} /> : null}
            <AppText variant="label" style={styles.label}>
              {label}
            </AppText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  edge: { borderRadius: radius.md, marginTop: edge.card },
  face: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: { textAlign: 'center' },
});
