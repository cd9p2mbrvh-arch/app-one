import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { edge, radius, spacing, useTheme } from '@/theme';

import { AppText } from '../AppText';
import { ChunkySurface } from '../ChunkySurface';
import { NarratorPortrait } from './NarratorPortrait';

type Props = {
  kind: 'narrator' | 'music';
  itemLabel: string;
  themeLabel: string;
  /** Narrator colour for the portrait, or music cover colour. */
  accent?: string;
};

/**
 * Shown instead of the narrator or music picker when the selected theme comes
 * with its own narrator or music.
 */
export function ThemeFixedChoice({ kind, itemLabel, themeLabel, accent = '#8FA9C8' }: Props) {
  const { colors } = useTheme();
  return (
    <ChunkySurface
      pressed={false}
      depth={edge.card}
      face={colors.surface}
      edge={colors.border}
      border={colors.border}
      style={styles.card}
    >
      <View
        accessible
        accessibilityLabel={`${itemLabel} is set by the ${themeLabel} theme`}
        style={styles.row}
      >
        {kind === 'narrator' ? (
          <View style={styles.portrait}>
            <NarratorPortrait id="fixed" accent={accent} width={72} height={88} />
          </View>
        ) : (
          <View style={[styles.cover, { backgroundColor: accent }]}>
            <Ionicons name="musical-notes" size={30} color="#FFFFFF" />
          </View>
        )}
        <View style={styles.text}>
          <View style={styles.badge}>
            <Ionicons name="link" size={14} color={colors.textMuted} />
            <AppText variant="caption" color={colors.textMuted}>
              Set by this theme
            </AppText>
          </View>
          <AppText variant="heading">{itemLabel}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            The {themeLabel} meditation is made for this {kind}. Choose another theme to pick your
            own.
          </AppText>
        </View>
      </View>
    </ChunkySurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  portrait: { borderRadius: radius.md, overflow: 'hidden' },
  cover: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
