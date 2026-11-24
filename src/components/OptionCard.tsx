import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { edge, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { ChunkySurface } from './ChunkySurface';

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
  const { colors } = useTheme();
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
        <ChunkySurface
          pressed={pressed}
          depth={edge.card}
          face={selected ? colors.primary : colors.surface}
          edge={edgeColor}
          border={selected ? colors.primary : colors.border}
          style={styles.face}
        >
          {icon ? (
            <Ionicons name={icon} size={26} color={selected ? colors.onPrimary : colors.primary} />
          ) : null}
          <AppText
            variant="label"
            color={selected ? colors.onPrimary : colors.text}
            style={styles.label}
          >
            {label}
          </AppText>
        </ChunkySurface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  face: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: { textAlign: 'center' },
});
