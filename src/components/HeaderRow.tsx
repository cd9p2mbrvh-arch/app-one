import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

/**
 * Width kept free at the right of every header while the app runs inside Expo Go,
 * whose floating gear button sits in the top-right corner and would cover
 * anything there. Zero in real builds (TestFlight / App Store / Google Play).
 */
export const EXPO_GO_CORNER = 64;

export function expoGoCornerInset(
  environment: string | undefined = Constants.executionEnvironment,
): number {
  return environment === ExecutionEnvironment.StoreClient ? EXPO_GO_CORNER : 0;
}

/** A screen's top row. Keeps clear of Expo Go's gear button in the top-right corner. */
export function HeaderRow({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return <View style={[style, { paddingRight: expoGoCornerInset() }]}>{children}</View>;
}
