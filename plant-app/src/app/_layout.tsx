import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { SettingsProvider, useSettings } from '@/lib/settings';

// Keep the native splash up until saved settings are loaded, so the user never
// sees the onboarding flash by before the dashboard appears.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loaded, profile } = useSettings();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  // Only one of the two groups is mounted at a time, so the dashboard never
  // polls the board before setup is done.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={profile.setupDone}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={!profile.setupDone}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RootNavigator />
    </SettingsProvider>
  );
}
