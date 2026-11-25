import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useCanGoBack } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Avatar, BackButton, ChunkySurface, Screen, HeaderRow } from '@/components';
import { canAddProfile, MAX_PROFILES, type Profile } from '@/domain/profiles';
import { useProfiles } from '@/state/profiles';
import { usePurchases } from '@/state/purchases';
import { useSessionSetup } from '@/state/sessionSetup';
import { edge, spacing, useTheme } from '@/theme';

/** Profile picker: choose who is meditating, add, or edit profiles. */
export default function ProfilesScreen() {
  const profiles = useProfiles((s) => s.profiles);
  const activeId = useProfiles((s) => s.activeId);
  const selectProfile = useProfiles((s) => s.selectProfile);
  const { colors } = useTheme();
  const canGoBack = useCanGoBack();

  const choose = (id: string) => {
    selectProfile(id);
    useSessionSetup.getState().reset();
    router.dismissTo('/home');
  };

  const tiles: (Profile | 'add')[] = [...profiles];
  if (canAddProfile(profiles)) tiles.push('add');
  const rows: (Profile | 'add')[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));

  return (
    <Screen>
      <HeaderRow style={styles.header}>
        {canGoBack ? <BackButton /> : null}
        <AppText variant="title">{"Who's meditating?"}</AppText>
      </HeaderRow>

      <View style={styles.grid}>
        {rows.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((tile) =>
              tile === 'add' ? (
                <Tile
                  key="add"
                  label="Add profile"
                  onPress={() => router.push('/profiles/new')}
                  icon={<Ionicons name="add" size={32} color={colors.primary} />}
                />
              ) : (
                <Tile
                  key={tile.id}
                  label={tile.name}
                  active={tile.id === activeId}
                  onPress={() => choose(tile.id)}
                  onEdit={() =>
                    router.push({ pathname: '/profiles/[id]', params: { id: tile.id } })
                  }
                  icon={<Avatar avatar={tile.avatar} />}
                />
              ),
            )}
            {row.length === 1 ? <View style={styles.spacer} /> : null}
          </View>
        ))}
      </View>

      <AppText variant="caption" color={colors.textMuted}>
        Up to {MAX_PROFILES} profiles. Progress is saved only on this device.
      </AppText>

      {/* Temporary: purchases are a mockup; this lets the flow be tried again. */}
      <Pressable
        onPress={() => usePurchases.getState().resetDemo()}
        accessibilityRole="button"
        accessibilityLabel="Reset demo purchases"
        hitSlop={8}
      >
        <AppText variant="caption" color={colors.textMuted} style={styles.reset}>
          Reset demo purchases
        </AppText>
      </Pressable>
    </Screen>
  );
}

type TileProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  onEdit?: () => void;
  active?: boolean;
};

function Tile({ label, icon, onPress, onEdit, active }: TileProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.tileWrap}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: !!active }}
      >
        {({ pressed }) => (
          <ChunkySurface
            pressed={pressed}
            depth={edge.card}
            face={colors.surface}
            edge={active ? colors.primaryEdge : colors.border}
            border={active ? colors.primary : colors.border}
            style={styles.tile}
          >
            {icon}
            <AppText variant="label" numberOfLines={1}>
              {label}
            </AppText>
          </ChunkySurface>
        )}
      </Pressable>
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label}`}
          hitSlop={8}
          style={[styles.edit, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="pencil" size={16} color={colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  reset: { textDecorationLine: 'underline' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  spacer: { flex: 1 },
  tileWrap: { flex: 1 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    minHeight: 140,
  },
  edit: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
