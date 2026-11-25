import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { useMusicPreview } from '@/audio/useMusicPreview';
import { lockReason, type LockReason, type MusicTrack } from '@/content/manifest';
import { tap } from '@/feedback';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { usePurchases } from '@/state/purchases';
import { spacing, useTheme } from '@/theme';
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

const TILE = 56;
const CARD_RADIUS = 24;
/** Length of the selection fade: short and quick. */
export const SELECT_FADE_MS = 160;

function accessibilityLabelFor(track: MusicTrack, lock: LockReason | null) {
  const status =
    lock?.kind === 'level'
      ? `, locked, level ${lock.level}`
      : lock?.kind === 'purchase'
        ? `, ${lock.priceLabel} to unlock`
        : '';
  return `${track.label}, ${track.mood}${status}`;
}

/** Fades its children in when `on` becomes true and out when it becomes false. */
function Fade({ on, style, children }: { on: boolean; style?: object; children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(on ? 1 : 0));
  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(on ? 1 : 0);
      return;
    }
    const anim = Animated.timing(opacity, {
      toValue: on ? 1 : 0,
      duration: SELECT_FADE_MS,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [on, opacity, reduceMotion]);
  return (
    <Animated.View pointerEvents="none" style={[style, { opacity }]}>
      {children}
    </Animated.View>
  );
}

/** Fades in once when it appears (used for the row's details). */
function FadeIn({ children }: { children: ReactNode }) {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduceMotion) return opacity.setValue(1);
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration: SELECT_FADE_MS,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [opacity, reduceMotion]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

/**
 * Music as a list of soft "3D" cards: each row has a glossy icon tile with a
 * coloured glow. Tapping a row plays a short preview and expands it (and selects
 * it if it is unlocked); tapping the playing row again stops the preview. The
 * selection highlight fades quickly from the old row to the new one. Locked
 * tracks can be previewed but not chosen.
 */
export function MusicList({ tracks, selectedId, level, owned, onSelect }: Props) {
  const { colors } = useTheme();
  const { playingId, play, stop } = useMusicPreview();
  const [focusedId, setFocusedId] = useState(selectedId);
  const [buying, setBuying] = useState<MusicTrack | null>(null);
  const buy = usePurchases((st) => st.buy);

  const onTap = (track: MusicTrack) => {
    tap();
    setFocusedId(track.id);
    if (!lockReason(track, level, owned)) onSelect(track.id);
    if (playingId === track.id) stop();
    else play(track.id, track.source);
  };

  return (
    <View style={styles.list}>
      {tracks.map((track) => {
        const lock = lockReason(track, level, owned);
        const selected = track.id === selectedId;
        const playing = track.id === playingId;
        const expanded = track.id === focusedId;
        return (
          <Pressable
            key={track.id}
            onPress={() => onTap(track)}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabelFor(track, lock)}
            accessibilityHint={playing ? 'Stops the preview' : 'Plays a short preview'}
            accessibilityState={{ selected }}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    boxShadow: `0px 10px 22px ${withAlpha(track.accent, 0.22)}`,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                {/* Selection highlight: border and glow, fades in and out. */}
                <Fade
                  on={selected}
                  style={[
                    styles.highlight,
                    {
                      borderColor: colors.primary,
                      boxShadow: `0px 12px 26px ${withAlpha(track.accent, 0.5)}`,
                    },
                  ]}
                >
                  {null}
                </Fade>

                <View style={styles.main}>
                  <GlossyTile
                    color={track.accent}
                    icon={track.icon}
                    size={TILE}
                    style={lock ? styles.dim : undefined}
                  />
                  <View style={styles.text}>
                    <AppText variant="label">{track.label}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {track.mood}
                    </AppText>
                  </View>
                  {lock?.kind === 'level' ? (
                    <View style={styles.status}>
                      <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
                      <AppText variant="caption" color={colors.textMuted}>
                        Lv {lock.level}
                      </AppText>
                    </View>
                  ) : lock?.kind === 'purchase' ? (
                    <PriceTag label={lock.priceLabel} compact />
                  ) : (
                    <Fade on={selected}>
                      <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
                    </Fade>
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

                {expanded ? (
                  <FadeIn>
                    <View style={[styles.details, { borderTopColor: colors.border }]}>
                      <AppText variant="caption" color={colors.textMuted}>
                        {lock?.kind === 'level'
                          ? `Preview only · reach level ${lock.level} to use this music`
                          : lock?.kind === 'purchase'
                            ? 'Preview only · unlock to use this music'
                            : playing
                              ? 'Playing a short preview · tap again to stop'
                              : 'Tap to hear a preview'}
                      </AppText>
                      {lock?.kind === 'purchase' ? (
                        <Pressable
                          onPress={() => setBuying(track)}
                          accessibilityRole="button"
                          accessibilityLabel={`Unlock ${track.label} for ${lock.priceLabel}`}
                          style={styles.unlock}
                        >
                          <PriceTag label={`Unlock for ${lock.priceLabel}`} />
                        </Pressable>
                      ) : null}
                    </View>
                  </FadeIn>
                ) : null}
              </View>
            )}
          </Pressable>
        );
      })}

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
  list: { gap: spacing.md },
  card: {
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
    padding: spacing.sm + 2,
  },
  highlight: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
  },
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dim: { opacity: 0.6 },
  text: { flex: 1, gap: 2 },
  status: { alignItems: 'center' },
  play: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    marginTop: spacing.sm + 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  unlock: { alignSelf: 'flex-start' },
});
