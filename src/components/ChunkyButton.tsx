import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { edge, radius, spacing, UI_MATERIAL, useTheme } from '@/theme';
import { withAlpha } from '@/theme/color';

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
  const glassPrimary = isPrimary && UI_MATERIAL === 'glass';

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
      {({ pressed }) =>
        glassPrimary ? (
          // See-through coloured glass with a glossy sheen, like the icon tiles.
          <View
            style={[
              styles.face,
              styles.glass,
              {
                backgroundColor: colors.glassButton,
                borderColor: withAlpha('#FFFFFF', 0.55),
                boxShadow: `0px 10px 24px ${withAlpha(colors.primaryEdge, 0.35)}, inset 0px 1px 0px ${withAlpha('#FFFFFF', 0.6)}`,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
              <Svg width="100%" height="100%">
                <Defs>
                  <LinearGradient id="buttonSheen" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.32} />
                    <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
                  </LinearGradient>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#buttonSheen)" />
              </Svg>
            </View>
            <AppText variant="button" color={textColor}>
              {title.toUpperCase()}
            </AppText>
          </View>
        ) : (
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
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  face: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  glass: { borderRadius: radius.md + 4, borderWidth: 1.5 },
  clip: { borderRadius: radius.md + 4, overflow: 'hidden' },
});
