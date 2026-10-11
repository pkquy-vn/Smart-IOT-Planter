import { StyleSheet, View } from 'react-native';

import { IntroScreen } from '@/components/intro-screen';
import { SetupScreen } from '@/components/setup-screen';
import { P } from '@/lib/palette';
import { useSettings } from '@/lib/settings';

// Full-screen overlay shown until the plant is set up: intro -> setup -> app.
export function OnboardingGate() {
  const { loaded, profile, introSeen, setIntroSeen } = useSettings();
  if (loaded && profile.setupDone) return null;
  return (
    <View style={styles.overlay}>
      {!loaded ? null : introSeen ? <SetupScreen /> : <IntroScreen onStart={() => setIntroSeen(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: P.paper },
});
