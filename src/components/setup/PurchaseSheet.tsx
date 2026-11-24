import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { radius, spacing, useTheme } from '@/theme';

import { AppText } from '../AppText';
import { ChunkyButton } from '../ChunkyButton';
import { PRICE_GOLD, PRICE_INK } from './PriceTag';

type Props = {
  visible: boolean;
  itemLabel: string;
  priceLabel: string;
  onBuy: () => void;
  onCancel: () => void;
};

/**
 * MOCKUP purchase confirmation. Nothing is charged: "Buy" just unlocks the item.
 * Will be replaced by the real App Store / Google Play purchase sheet.
 */
export function PurchaseSheet({ visible, itemLabel, priceLabel, onBuy, onCancel }: Props) {
  const { colors, backdrop } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.root}>
        {/* Dimmed area behind the sheet; drawn first so the sheet is always on top. */}
        <Pressable
          style={[StyleSheet.absoluteFill, styles.backdrop]}
          onPress={onCancel}
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
          <View style={[styles.demo, { backgroundColor: PRICE_GOLD }]}>
            <AppText variant="caption" color={PRICE_INK} style={styles.demoText}>
              DEMO · no payment is made
            </AppText>
          </View>
          <AppText variant="title">Unlock {itemLabel}</AppText>
          <AppText color={colors.textMuted}>
            One-time purchase. Available to every profile on this device.
          </AppText>
          <ChunkyButton title={`Buy for ${priceLabel}`} onPress={onBuy} />
          <ChunkyButton title="Not now" variant="secondary" onPress={onCancel} />
          <AppText variant="caption" color={colors.textMuted} style={styles.note}>
            In the released app this will use the App Store or Google Play.
          </AppText>
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
  demo: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  demoText: { fontFamily: 'Nunito_900Black' },
  note: { textAlign: 'center' },
});
