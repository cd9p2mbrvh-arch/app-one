import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Theme } from '@/content/manifest';
import { tap } from '@/feedback';
import { spacing, useGlass, useTheme } from '@/theme';
import { withAlpha } from '@/theme/color';

import { AppText } from '../AppText';
import { GlossyTile } from '../GlossyTile';
import { Fade } from '../SelectFade';

type Props = {
  themes: Theme[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const CARD_RADIUS = 24;
const TILE = 72;

/**
 * Themes as large square cards, two per row, in the same soft "3D" style as the
 * music list: a glossy, glowing icon tile in the theme's own light colour. The
 * selection highlight fades quickly from one square to the next.
 */
export function ThemeGrid({ themes, selectedId, onSelect }: Props) {
  const rows: Theme[][] = [];
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
  theme: Theme;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const glass = useGlass();
  const accent = theme.accent ?? colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={theme.label}
      accessibilityState={{ selected }}
      style={styles.cell}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.square,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              boxShadow: `0px 10px 22px ${withAlpha(accent, 0.25)}${glass.highlight}`,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          {/* Selection highlight: border and glow, fades in and out. */}
          <Fade
            on={selected}
            style={[
              styles.highlight,
              {
                borderColor: colors.primary,
                boxShadow: `0px 12px 26px ${withAlpha(accent, 0.55)}`,
              },
            ]}
          />
          <GlossyTile color={accent} icon={theme.icon} size={TILE} />
          <AppText variant="label" style={styles.label}>
            {theme.label}
          </AppText>
          <Fade on={selected} style={styles.check}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </Fade>
        </View>
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
    gap: spacing.sm + 4,
    padding: spacing.sm,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
  },
  highlight: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
  },
  label: { textAlign: 'center' },
  check: { position: 'absolute', top: spacing.sm, right: spacing.sm },
});
