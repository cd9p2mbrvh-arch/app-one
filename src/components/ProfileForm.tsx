import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AVATARS,
  MAX_NAME_LENGTH,
  NAME_ERROR_MESSAGES,
  type AvatarId,
  type NameError,
} from '@/domain/profiles';
import { radius, spacing, useTheme } from '@/theme';

import { AppText } from './AppText';
import { ChunkyButton } from './ChunkyButton';
import { TextField } from './TextField';

const AVATAR_LABELS: Record<AvatarId, string> = {
  sunny: 'Sun',
  moon: 'Moon',
  leaf: 'Leaf',
  flower: 'Flower',
  star: 'Star',
  water: 'Water drop',
  paw: 'Paw',
  planet: 'Planet',
};

type Props = {
  initialName?: string;
  initialAvatar?: AvatarId;
  submitLabel: string;
  /** Returns an error to show, or null on success. */
  onSubmit: (name: string, avatar: AvatarId) => NameError | 'limitReached' | 'notFound' | null;
};

const EXTRA_ERRORS = {
  limitReached: 'You already have 4 profiles.',
  notFound: 'This profile no longer exists.',
};

export function ProfileForm({
  initialName = '',
  initialAvatar = 'sunny',
  submitLabel,
  onSubmit,
}: Props) {
  const { colors } = useTheme();
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState<AvatarId>(initialAvatar);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const result = onSubmit(name, avatar);
    if (result) {
      setError(
        result in NAME_ERROR_MESSAGES
          ? NAME_ERROR_MESSAGES[result as NameError]
          : EXTRA_ERRORS[result as keyof typeof EXTRA_ERRORS],
      );
    }
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder="Your name"
        maxLength={MAX_NAME_LENGTH + 5}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="done"
        onSubmitEditing={submit}
        error={error}
      />

      <View style={styles.avatars}>
        <AppText variant="label">Symbol</AppText>
        <View style={styles.avatarGrid}>
          {AVATARS.map((id) => {
            const selected = id === avatar;
            return (
              <Pressable
                key={id}
                onPress={() => setAvatar(id)}
                accessibilityRole="button"
                accessibilityLabel={AVATAR_LABELS[id]}
                accessibilityState={{ selected }}
                style={[
                  styles.avatarOption,
                  {
                    backgroundColor: selected ? colors.primary : colors.surface,
                    borderColor: selected ? colors.primaryEdge : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={id}
                  size={28}
                  color={selected ? colors.onPrimary : colors.primary}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <ChunkyButton title={submitLabel} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  avatars: { gap: spacing.sm },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
