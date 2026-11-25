import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, UI_MATERIAL, useGlass, useTheme } from '@/theme';
import { withAlpha } from '@/theme/color';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** A panel that slides up from the bottom over a dimmed background. */
export function Sheet({ visible, onClose, children }: Props) {
  const { colors, backdrop } = useTheme();
  const glass = useGlass();
  const isGlass = UI_MATERIAL === 'glass';
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Dimmed area behind the sheet; drawn first so the sheet is always on top. */}
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.sheet,
            isGlass
              ? {
                  // Frosted glass: mostly the look's base colour so text stays easy to read.
                  backgroundColor: withAlpha(backdrop.gradient[1], 0.82),
                  borderColor: colors.border,
                  boxShadow: glass.shadow,
                }
              : { backgroundColor: backdrop.gradient[1], borderColor: colors.border },
          ]}
          accessibilityViewIsModal
        >
          {isGlass ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
              <BlurView intensity={60} tint={backdrop.glass} style={StyleSheet.absoluteFill} />
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: '#00000066' },
  clip: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
    zIndex: -1,
  },
  sheet: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 2,
  },
});
