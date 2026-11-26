import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Background, Intro, INTRO } from '@/components';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { ThemeProvider, useTheme } from '@/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
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
  const reduceMotion = useReduceMotion();
  // Launch intro, then the screens zoom in (0 = hidden and small, 1 = in place).
  const [introDone, setIntroDone] = useState(false);
  const [appIn] = useState(() => new Animated.Value(0));

  const reveal = () =>
    Animated.timing(appIn, {
      toValue: 1,
      duration: INTRO.appZoom,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={styles.root}>
      <Background topInset={insets.top} />
      <StatusBar style={colors.statusBar} />
      <Animated.View
        style={[
          styles.root,
          {
            opacity: appIn,
            transform: [
              {
                scale: appIn.interpolate({
                  inputRange: [0, 1],
                  outputRange: [reduceMotion ? 1 : 0.92, 1],
                }),
              },
            ],
          },
        ]}
      >
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
      </Animated.View>
      {introDone ? null : <Intro onReveal={reveal} onDone={() => setIntroDone(true)} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
