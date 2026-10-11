import { IntroScreen } from '@/components/intro-screen';
import { SetupScreen } from '@/components/setup-screen';
import { useSettings } from '@/lib/settings';

// intro -> setup -> (tabs). The root layout swaps this route out as soon as
// the profile is saved.
export default function OnboardingScreen() {
  const { introSeen, setIntroSeen } = useSettings();
  return introSeen ? <SetupScreen /> : <IntroScreen onStart={() => setIntroSeen(true)} />;
}
