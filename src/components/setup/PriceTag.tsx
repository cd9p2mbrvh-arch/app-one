import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../AppText';

/** Gold price badge for paid content (fixed colours, readable on any background). */
export const PRICE_GOLD = '#F2C14E';
export const PRICE_INK = '#3A2A00';

export function PriceTag({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <View style={[styles.tag, compact && styles.compact]}>
      <Ionicons name="cart" size={compact ? 11 : 13} color={PRICE_INK} />
      <AppText variant="caption" color={PRICE_INK} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: PRICE_GOLD,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  compact: { paddingHorizontal: 6, paddingVertical: 1 },
  text: { fontFamily: 'Nunito_900Black' },
});
