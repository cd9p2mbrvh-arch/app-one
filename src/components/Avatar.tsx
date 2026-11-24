import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import type { AvatarId } from '@/domain/profiles';
import { useTheme } from '@/theme';

/** A profile's symbol in a circle. */
export function Avatar({ avatar, size = 56 }: { avatar: AvatarId; size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={avatar} size={size * 0.5} color={colors.onPrimary} />
    </View>
  );
}
