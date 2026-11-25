import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useMusicPreview } from '@/audio/useMusicPreview';
import { lockReason, type LockReason, type MusicTrack } from '@/content/manifest';
import { tap } from '@/feedback';
import { usePurchases } from '@/state/purchases';
import { radius, spacing, useTheme } from '@/theme';
import { withAlpha } from '@/theme/color';

import { AppText } from '../AppText';
import { GlossyTile } from '../GlossyTile';
import { Equalizer } from './Equalizer';
import { PriceTag } from './PriceTag';
import { PurchaseSheet } from './PurchaseSheet';

type Props = {
  tracks: MusicTrack[];
  selectedId: string;
  level: number;
  /** Owned product ids (paid tracks). */
  owned: ReadonlySet<string>;
  onSelect: (id: string) => void;
};

type Filter = 'all' | 'free' | 'premium';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'free', label: 'Free' },
  { id: 'premium', label: 'Premium' },
];

const TILE = 64;
const CARD_RADIUS = 28;

function accessibilityLabelFor(track: MusicTrack, lock: LockReason | null) {
  const status =
    lock?.kind === 'level'
      ? `, locked, level ${lock.level}`
      : lock?.kind === 'purchase'
        ? `, ${lock.priceLabel} to unlock`
        : '';
  return `${track.label}, ${track.mood}${status}`;
}

/**
 * Music as soft "3D" cards in two columns: each card has a glossy icon tile that
 * pops out of its top edge. Filter chips on top, and a small player bar below
 * that tells what is playing and offers the unlock. Tapping a card plays a short
 * preview (and selects it if it is unlocked); tapping it again stops the preview.
 */
export function MusicCards({ tracks, selectedId, level, owned, onSelect }: Props) {
  const { colors } = useTheme();
  const { playingId, play, stop } = useMusicPreview();
  const [focusedId, setFocusedId] = useState(selectedId);
  const [filter, setFilter] = useState<Filter>('all');
  const [buying, setBuying] = useState<MusicTrack | null>(null);
  const buy = usePurchases((st) => st.buy);

  const visible = tracks.filter((t) =>
    filter === 'all' ? true : filter === 'premium' ? !!t.purchase : !t.purchase,
  );
  const focused = tracks.find((t) => t.id === focusedId) ?? tracks[0];
  const focusedLock = lockReason(focused, level, owned);
  const focusedPlaying = focused.id === playingId;

  const onTap = (track: MusicTrack) => {
    tap();
    setFocusedId(track.id);
    if (!lockReason(track, level, owned)) onSelect(track.id);
    if (playingId === track.id) stop();
    else play(track.id, track.source);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                tap();
                setFilter(f.id);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Show ${f.label.toLowerCase()} music`}
              accessibilityState={{ selected: on }}
              style={[
                styles.chip,
                on
                  ? {
                      backgroundColor: colors.primary,
                      boxShadow: `0px 6px 14px ${withAlpha(colors.primaryEdge, 0.35)}`,
                    }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <AppText variant="label" color={on ? colors.onPrimary : colors.text}>
                {f.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.grid}>
        {visible.map((track) => {
          const lock = lockReason(track, level, owned);
          const selected = track.id === selectedId;
          const playing = track.id === playingId;
          return (
            <Pressable
              key={track.id}
              onPress={() => onTap(track)}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabelFor(track, lock)}
              accessibilityHint={playing ? 'Stops the preview' : 'Plays a short preview'}
              accessibilityState={{ selected }}
              style={styles.cell}
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                      boxShadow: `0px 12px 24px ${withAlpha(track.accent, selected ? 0.45 : 0.25)}`,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    },
                  ]}
                >
                  <GlossyTile
                    color={track.accent}
                    icon={track.icon}
                    size={TILE}
                    style={[styles.tile, lock ? styles.dim : null]}
                  />
                  {selected ? (
                    <View
                      style={[
                        styles.check,
                        { backgroundColor: colors.primary, borderColor: colors.onPrimary },
                      ]}
                    >
                      <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                    </View>
                  ) : null}
                  <AppText variant="label" style={styles.center}>
                    {track.label}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={colors.textMuted}
                    style={styles.center}
                    numberOfLines={2}
                  >
                    {track.mood}
                  </AppText>
                  <View style={styles.footer}>
                    {lock?.kind === 'level' ? (
                      <View style={styles.lock}>
                        <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                        <AppText variant="caption" color={colors.textMuted}>
                          Lv {lock.level}
                        </AppText>
                      </View>
                    ) : lock?.kind === 'purchase' ? (
                      <PriceTag label={lock.priceLabel} compact />
                    ) : (
                      <View />
                    )}
                    <View
                      style={[
                        styles.play,
                        { backgroundColor: playing ? colors.primary : colors.track },
                      ]}
                    >
                      {playing ? (
                        <Equalizer color={colors.onPrimary} height={14} />
                      ) : (
                        <Ionicons name="play" size={16} color={colors.primary} />
                      )}
                    </View>
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Mini player: what is playing / why a track can't be chosen. */}
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            boxShadow: `0px 10px 22px ${withAlpha(focused.accent, 0.3)}`,
          },
        ]}
      >
        <GlossyTile color={focused.accent} icon={focused.icon} size={40} />
        <View style={styles.barText}>
          <AppText variant="label">{focused.label}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {focusedLock?.kind === 'level'
              ? `Preview only · reach level ${focusedLock.level} to use this music`
              : focusedLock?.kind === 'purchase'
                ? 'Preview only · unlock to use this music'
                : focusedPlaying
                  ? 'Playing a short preview · tap again to stop'
                  : 'Tap to hear a preview'}
          </AppText>
        </View>
        {focusedLock?.kind === 'purchase' ? (
          <Pressable
            onPress={() => setBuying(focused)}
            accessibilityRole="button"
            accessibilityLabel={`Unlock ${focused.label} for ${focusedLock.priceLabel}`}
          >
            <PriceTag label={`Unlock ${focusedLock.priceLabel}`} />
          </Pressable>
        ) : null}
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
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
  },
  cell: { width: '48%', paddingTop: TILE / 2 },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
    paddingHorizontal: spacing.sm + 4,
    paddingBottom: spacing.sm + 4,
    alignItems: 'center',
    gap: 2,
  },
  tile: { marginTop: -TILE / 2, marginBottom: spacing.sm },
  dim: { opacity: 0.6 },
  check: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  footer: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm + 4,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  barText: { flex: 1, gap: 2 },
});
