import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, BackButton, ProfileForm, Screen, HeaderRow } from '@/components';
import { useProfiles } from '@/state/profiles';
import { useSessionSetup } from '@/state/sessionSetup';
import { spacing, useTheme } from '@/theme';

export default function NewProfileScreen() {
  const { colors } = useTheme();
  const isFirst = useProfiles((s) => s.profiles.length === 0);
  const addProfile = useProfiles((s) => s.addProfile);

  return (
    <Screen>
      <HeaderRow style={styles.header}>
        {!isFirst ? <BackButton /> : null}
        <AppText variant="title">{isFirst ? 'Welcome to App One' : 'New profile'}</AppText>
      </HeaderRow>
      {isFirst ? (
        <AppText color={colors.textMuted}>
          Create your profile to keep track of your progress. Everything stays on this device.
        </AppText>
      ) : null}

      <ProfileForm
        submitLabel="Create profile"
        onSubmit={(name, avatar) => {
          const result = addProfile(name, avatar);
          if (!result.ok) return result.error;
          useSessionSetup.getState().reset();
          router.dismissTo('/home');
          return null;
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
