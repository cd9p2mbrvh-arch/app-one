import { Pressable, StyleSheet } from 'react-native';

import { edge, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { ChunkySurface } from './ChunkySurface';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  testID?: string;
};

/**
 * Duolingo-style button: a coloured face sitting on a darker "edge".
 * Pressing it moves the face down onto the edge.
 */
export function ChunkyButton({ title, onPress, variant = 'primary', disabled, testID }: Props) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const face = isPrimary ? colors.primary : colors.surface;
  const edgeColor = isPrimary ? colors.primaryEdge : colors.border;
  const textColor = isPrimary ? colors.onPrimary : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {({ pressed }) => (
        <ChunkySurface
          pressed={pressed}
          depth={edge.button}
          face={face}
          edge={edgeColor}
          border={edgeColor}
          style={styles.face}
        >
          <AppText variant="button" color={textColor}>
            {title.toUpperCase()}
          </AppText>
        </ChunkySurface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
});
