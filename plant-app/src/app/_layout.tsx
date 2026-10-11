import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { SettingsProvider, useSettings } from '@/lib/settings';
import { StatusProvider } from '@/lib/status';
import { TourProvider } from '@/lib/tour';

// Keep the native splash up until saved settings and the font are loaded, so the user never
// sees the onboarding flash by before the dashboard appears.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { loaded, profile } = useSettings();
  // Latin subset of Gaegu Bold (72 KB instead of the 3 MB Google Fonts package), so the
  // web build fits on the planter's flash. Regenerate with scripts/build-planter.mjs notes.
  const [fontsLoaded, fontError] = useFonts({ Gaegu_700Bold: require('@/assets/fonts/Gaegu_700Bold.ttf') });
  // A font that fails to load falls back to the system font rather than blocking the app.
  const ready = loaded && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

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
      <StatusProvider>
        <TourProvider>
          <RootNavigator />
        </TourProvider>
      </StatusProvider>
    </SettingsProvider>
  );
}
