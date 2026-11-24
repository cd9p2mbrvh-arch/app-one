import { Pressable, StyleSheet, View } from 'react-native';

import { edge, radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';

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
        <View style={[styles.edge, { backgroundColor: edgeColor }]}>
          <View
            style={[
              styles.face,
              { backgroundColor: face, borderColor: edgeColor },
              { transform: [{ translateY: pressed ? 0 : -edge.button }] },
            ]}
          >
            <AppText variant="button" color={textColor}>
              {title.toUpperCase()}
            </AppText>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: {
    borderRadius: radius.md,
    marginTop: edge.button,
  },
  face: {
    borderRadius: radius.md,
    borderWidth: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
});
