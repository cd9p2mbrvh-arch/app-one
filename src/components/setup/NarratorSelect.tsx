import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { speakAs, stopSpeaking } from '@/audio/narratorVoice';
import { lockReason, type Narrator } from '@/content/manifest';
import { usePurchases } from '@/state/purchases';
import { radius, spacing, useTheme } from '@/theme';
import { tap } from '@/feedback';

import { AppText } from '../AppText';
import { Equalizer } from './Equalizer';
import { NarratorPortrait } from './NarratorPortrait';
import { PriceTag } from './PriceTag';
import { PurchaseSheet } from './PurchaseSheet';

type Props = {
  narrators: Narrator[];
  selectedId: string;
  level: number;
  /** Owned product ids (paid narrators). */
  owned: ReadonlySet<string>;
  onSelect: (id: string) => void;
};

const COLUMNS = 3;

/**
 * Character-select style narrator picker: a large spotlight of the focused
 * narrator above a grid of portrait cards. Tapping a card plays a short sample.
 * Locked narrators can be previewed but not chosen.
 */
export function NarratorSelect({ narrators, selectedId, level, owned, onSelect }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [focusedId, setFocusedId] = useState(selectedId);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [buying, setBuying] = useState<Narrator | null>(null);
  const buy = usePurchases((st) => st.buy);
  const [pop] = useState(() => new Animated.Value(1));

  useEffect(() => stopSpeaking, []);

  const focused = narrators.find((n) => n.id === focusedId) ?? narrators[0];
  const focusedLock = lockReason(focused, level, owned);

  const onTap = (narrator: Narrator) => {
    tap();
    setFocusedId(narrator.id);
    if (!lockReason(narrator, level, owned)) onSelect(narrator.id);
    pop.setValue(0.9);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
    setSpeakingId(narrator.id);
    speakAs(narrator, narrators.indexOf(narrator), narrator.sample, () =>
      setSpeakingId((id) => (id === narrator.id ? null : id)),
    ).catch(() => setSpeakingId(null));
  };

  const contentWidth = Math.min(width, 520) - spacing.lg * 2;
  const cardWidth = (contentWidth - spacing.sm * (COLUMNS - 1)) / COLUMNS;
  const spotlightHeight = Math.min(190, contentWidth * 0.52);

  const rows: Narrator[][] = [];
  for (let i = 0; i < narrators.length; i += COLUMNS) rows.push(narrators.slice(i, i + COLUMNS));

  return (
    <View style={styles.wrap}>
      <View
        testID="narrator-spotlight"
        accessible
        accessibilityLabel={`${focused.label}. ${focused.tagline}.${
          focusedLock?.kind === 'level'
            ? ` Locked. Unlocks at level ${focusedLock.level}.`
            : focusedLock?.kind === 'purchase'
              ? ` Available for ${focusedLock.priceLabel}.`
              : ''
        }`}
        style={[
          styles.spotlight,
          { height: spotlightHeight, borderColor: colors.border, backgroundColor: focused.accent },
        ]}
      >
        <View style={[StyleSheet.absoluteFill, styles.spotlightGlow]} />
        <Animated.View
          style={[
            styles.spotlightPortrait,
            { transform: [{ scale: pop }], transformOrigin: 'bottom' },
          ]}
        >
          <NarratorPortrait
            id="spotlight"
            accent={focused.accent}
            width={spotlightHeight * 0.8}
            height={spotlightHeight}
          />
        </Animated.View>
        <View style={styles.spotlightShade} />
        <View style={styles.spotlightText}>
          <AppText variant="title" color="#FFFFFF">
            {focused.label}
          </AppText>
          <AppText variant="label" color="#FFFFFF">
            {focused.tagline}
          </AppText>
          {focusedLock?.kind === 'level' ? (
            <View style={styles.inline}>
              <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
              <AppText variant="caption" color="#FFFFFF">
                Unlocks at level {focusedLock.level} · preview only
              </AppText>
            </View>
          ) : null}
          {focusedLock?.kind === 'purchase' ? (
            <Pressable
              onPress={() => setBuying(focused)}
              accessibilityRole="button"
              accessibilityLabel={`Unlock ${focused.label} for ${focusedLock.priceLabel}`}
              style={styles.unlock}
            >
              <PriceTag label={`Unlock for ${focusedLock.priceLabel}`} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.spotlightBadge}>
          {speakingId === focused.id ? (
            <Equalizer color="#FFFFFF" />
          ) : (
            <Pressable
              onPress={() => onTap(focused)}
              accessibilityRole="button"
              accessibilityLabel={`Play ${focused.label} sample`}
              hitSlop={8}
            >
              <Ionicons name="play-circle" size={34} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((n) => {
              const lock = lockReason(n, level, owned);
              const selected = n.id === selectedId;
              const isFocused = n.id === focusedId;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => onTap(n)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    lock?.kind === 'level'
                      ? `${n.label}, locked, level ${lock.level}`
                      : lock?.kind === 'purchase'
                        ? `${n.label}, ${lock.priceLabel} to unlock`
                        : n.label
                  }
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      width: cardWidth,
                      borderColor: selected
                        ? colors.primary
                        : isFocused
                          ? colors.textMuted
                          : colors.border,
                      borderWidth: selected ? 3 : 2,
                      backgroundColor: colors.surface,
                      transform: [{ scale: pressed ? 0.96 : selected ? 1.03 : 1 }],
                    },
                  ]}
                >
                  <NarratorPortrait
                    id={n.id}
                    accent={n.accent}
                    width={cardWidth - 6}
                    height={(cardWidth - 6) * 1.15}
                  />
                  {lock?.kind === 'level' ? (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={22} color="#FFFFFF" />
                      <AppText variant="caption" color="#FFFFFF">
                        Lv {lock.level}
                      </AppText>
                    </View>
                  ) : null}
                  {lock?.kind === 'purchase' ? (
                    <View style={styles.priceBadge}>
                      <PriceTag label={lock.priceLabel} compact />
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.nameStrip,
                      { backgroundColor: selected ? colors.primary : 'transparent' },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      numberOfLines={1}
                      color={selected ? colors.onPrimary : colors.text}
                      style={styles.name}
                    >
                      {n.label}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <PurchaseSheet
        visible={buying !== null}
        itemLabel={buying?.label ?? ''}
        priceLabel={buying?.purchase?.priceLabel ?? ''}
        onCancel={() => setBuying(null)}
        onBuy={() => {
          if (buying?.purchase) {
            tap();
            buy(buying.purchase.productId);
            onSelect(buying.id);
          }
          setBuying(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  spotlight: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 2 },
  spotlightGlow: { backgroundColor: '#00000026' },
  spotlightPortrait: { position: 'absolute', right: spacing.md, bottom: 0 },
  spotlightShade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '62%',
    backgroundColor: '#00000047',
  },
  spotlightText: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    bottom: spacing.md,
    width: '55%',
    justifyContent: 'flex-end',
    gap: 2,
  },
  spotlightBadge: { position: 'absolute', left: spacing.md, top: spacing.md },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  unlock: { alignSelf: 'flex-start', marginTop: spacing.xs },
  priceBadge: { position: 'absolute', top: 6, right: 6 },
  grid: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  card: { borderRadius: radius.md, overflow: 'hidden', alignItems: 'center' },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 26,
    backgroundColor: '#0000008C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  nameStrip: { alignSelf: 'stretch', paddingVertical: 4 },
  name: { textAlign: 'center', fontFamily: 'Nunito_800ExtraBold' },
});
