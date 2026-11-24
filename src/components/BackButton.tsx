import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme';

export function BackButton({ onPress = () => router.back() }: { onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Back" hitSlop={12}>
      <Ionicons name="chevron-back" size={28} color={colors.text} />
    </Pressable>
  );
}
