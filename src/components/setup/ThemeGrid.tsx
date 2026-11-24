import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { CatalogItem } from '@/content/manifest';
import { edge, spacing, useTheme } from '@/theme';
import { tap } from '@/feedback';

import { AppText } from '../AppText';
import { ChunkySurface } from '../ChunkySurface';

type Props = {
  themes: CatalogItem[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Themes as large square tiles, two per row. */
export function ThemeGrid({ themes, selectedId, onSelect }: Props) {
  const rows: CatalogItem[][] = [];
  for (let i = 0; i < themes.length; i += 2) rows.push(themes.slice(i, i + 2));
  return (
    <View style={styles.grid}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((theme) => (
            <ThemeSquare
              key={theme.id}
              theme={theme}
              selected={theme.id === selectedId}
              onPress={() => {
                tap();
                onSelect(theme.id);
              }}
            />
          ))}
          {row.length === 1 ? <View style={styles.cell} /> : null}
        </View>
      ))}
    </View>
  );
}

function ThemeSquare({
  theme,
  selected,
  onPress,
}: {
  theme: CatalogItem;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={theme.label}
      accessibilityState={{ selected }}
      style={styles.cell}
    >
      {({ pressed }) => (
        <ChunkySurface
          pressed={pressed}
          depth={edge.card}
          face={selected ? colors.primary : colors.surface}
          edge={selected ? colors.primaryEdge : colors.border}
          border={selected ? colors.primary : colors.border}
          style={styles.square}
        >
          <Ionicons name={theme.icon} size={44} color={selected ? fg : colors.primary} />
          <AppText variant="label" color={fg} style={styles.label}>
            {theme.label}
          </AppText>
          {selected ? (
            <View style={styles.check}>
              <Ionicons name="checkmark-circle" size={22} color={colors.onPrimary} />
            </View>
          ) : null}
        </ChunkySurface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  cell: { flex: 1 },
  square: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  label: { textAlign: 'center' },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
});
