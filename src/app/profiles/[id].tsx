import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, BackButton, ChunkyButton, ProfileForm, Screen, HeaderRow } from '@/components';
import { useProfiles } from '@/state/profiles';
import { radius, spacing, useTheme } from '@/theme';

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const profile = useProfiles((s) => s.profiles.find((p) => p.id === id));
  const updateProfile = useProfiles((s) => s.updateProfile);
  const deleteProfile = useProfiles((s) => s.deleteProfile);
  const [confirming, setConfirming] = useState(false);

  if (!profile) return <Redirect href="/profiles" />;

  const onDelete = () => {
    deleteProfile(profile.id);
    const left = useProfiles.getState().profiles.length;
    if (left === 0) router.replace('/profiles/new');
    else router.back();
  };

  return (
    <Screen>
      <HeaderRow style={styles.header}>
        <BackButton />
        <AppText variant="title">Edit profile</AppText>
      </HeaderRow>

      <ProfileForm
        initialName={profile.name}
        initialAvatar={profile.avatar}
        submitLabel="Save"
        onSubmit={(name, avatar) => {
          const result = updateProfile(profile.id, { name, avatar });
          if (!result.ok) return result.error;
          router.back();
          return null;
        }}
      />

      {confirming ? (
        <View
          style={[styles.confirm, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="label">Delete {profile.name}?</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            All progress for this profile will be lost. This cannot be undone.
          </AppText>
          <ChunkyButton title="Yes, delete" onPress={onDelete} />
          <ChunkyButton title="Cancel" variant="secondary" onPress={() => setConfirming(false)} />
        </View>
      ) : (
        <ChunkyButton
          title="Delete profile"
          variant="secondary"
          onPress={() => setConfirming(true)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  confirm: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 2 },
});
