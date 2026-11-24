import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** A panel that slides up from the bottom over a dimmed background. */
export function Sheet({ visible, onClose, children }: Props) {
  const { colors, backdrop } = useTheme();
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
            { backgroundColor: backdrop.gradient[1], borderColor: colors.border },
          ]}
          accessibilityViewIsModal
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: '#00000066' },
  sheet: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.md,
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 2,
  },
});
