import {
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background } from '@/components';
import { ThemeProvider, useTheme } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  // Keep the native splash visible until fonts are ready. If fonts fail to load,
  // continue with system fonts rather than blocking the app.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}

// The navigator paints its own opaque background by default, which would hide
// the time-of-day gradient. Make it transparent.
const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

function ThemedStack() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <Background topInset={insets.top} />
      <StatusBar style={colors.statusBar} />
      <NavigationThemeProvider value={navigationTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'fade',
          }}
        >
          {/* No swipe-back during or right after a session. */}
          <Stack.Screen name="session" options={{ gestureEnabled: false }} />
          <Stack.Screen name="complete" options={{ gestureEnabled: false }} />
        </Stack>
      </NavigationThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
