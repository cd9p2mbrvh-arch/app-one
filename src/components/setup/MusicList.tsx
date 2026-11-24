import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useMusicPreview } from '@/audio/useMusicPreview';
import { isUnlocked, type MusicTrack } from '@/content/manifest';
import { edge, radius, spacing, useTheme } from '@/theme';
import { tap } from '@/feedback';

import { AppText } from '../AppText';
import { ChunkySurface } from '../ChunkySurface';
import { Equalizer } from './Equalizer';

type Props = {
  tracks: MusicTrack[];
  selectedId: string;
  level: number;
  onSelect: (id: string) => void;
};

/**
 * Music as a list of rows, like a music app. Tapping a row plays a short preview
 * and expands it; tapping the playing row again stops it. Locked tracks can be
 * previewed but not chosen.
 */
export function MusicList({ tracks, selectedId, level, onSelect }: Props) {
  const { colors } = useTheme();
  const { playingId, play, stop } = useMusicPreview();
  const [focusedId, setFocusedId] = useState(selectedId);

  const onTap = (track: MusicTrack) => {
    tap();
    setFocusedId(track.id);
    if (isUnlocked(track, level)) onSelect(track.id);
    if (playingId === track.id) stop();
    else play(track.id, track.source);
  };

  return (
    <View style={styles.list}>
      {tracks.map((track) => {
        const locked = !isUnlocked(track, level);
        const selected = track.id === selectedId;
        const playing = track.id === playingId;
        const expanded = track.id === focusedId;
        return (
          <Pressable
            key={track.id}
            onPress={() => onTap(track)}
            accessibilityRole="button"
            accessibilityLabel={`${track.label}, ${track.mood}${locked ? `, locked, level ${track.unlockLevel}` : ''}`}
            accessibilityHint={playing ? 'Stops the preview' : 'Plays a short preview'}
            accessibilityState={{ selected }}
          >
            {({ pressed }) => (
              <ChunkySurface
                pressed={pressed}
                depth={edge.card}
                face={colors.surface}
                edge={selected ? colors.primaryEdge : colors.border}
                border={selected ? colors.primary : colors.border}
                style={styles.row}
              >
                <View style={styles.main}>
                  <View style={[styles.cover, { backgroundColor: track.accent }]}>
                    <Ionicons name={track.icon} size={26} color="#FFFFFF" />
                  </View>
                  <View style={styles.text}>
                    <AppText variant="label">{track.label}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      {track.mood}
                    </AppText>
                  </View>
                  {locked ? (
                    <View style={styles.status}>
                      <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
                      <AppText variant="caption" color={colors.textMuted}>
                        Lv {track.unlockLevel}
                      </AppText>
                    </View>
                  ) : selected ? (
                    <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
                  ) : null}
                  <View style={styles.play}>
                    {playing ? (
                      <Equalizer color={colors.primary} />
                    ) : (
                      <Ionicons name="play" size={22} color={colors.primary} />
                    )}
                  </View>
                </View>
                {expanded ? (
                  <View style={[styles.details, { borderTopColor: colors.border }]}>
                    <AppText variant="caption" color={colors.textMuted}>
                      {locked
                        ? `Preview only · reach level ${track.unlockLevel} to use this music`
                        : playing
                          ? 'Playing a short preview · tap again to stop'
                          : 'Tap to hear a preview'}
                    </AppText>
                  </View>
                ) : null}
              </ChunkySurface>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: { padding: spacing.sm },
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cover: {
    width: 56,
    height: 56,
    borderRadius: radius.md - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 2 },
  status: { alignItems: 'center' },
  play: { width: 28, alignItems: 'center' },
  details: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1 },
});
