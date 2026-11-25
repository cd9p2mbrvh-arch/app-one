import { StyleSheet, View } from 'react-native';

import { fonts, spacing, useTheme } from '@/theme';

import { AppText } from '../AppText';
import { ChunkyButton } from '../ChunkyButton';
import { Sheet } from '../Sheet';
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
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} onClose={onCancel}>
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
    </Sheet>
  );
}

const styles = StyleSheet.create({
  demo: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: spacing.xs,
  },
  demoText: { fontFamily: fonts.black },
  note: { textAlign: 'center' },
});
