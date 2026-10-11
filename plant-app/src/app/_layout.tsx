import { Gaegu_700Bold, useFonts } from '@expo-google-fonts/gaegu';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OnboardingGate } from '@/components/onboarding-gate';
import { SettingsProvider } from '@/lib/settings';
import { StatusProvider } from '@/lib/status';
import { TourProvider } from '@/lib/tour';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({ Gaegu_700Bold });
  // Keep the splash screen up until the font is ready (or failed, then fall back to the system font).
  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <SettingsProvider>
        <StatusProvider>
          <TourProvider>
            <AppTabs />
            <OnboardingGate />
          </TourProvider>
        </StatusProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
