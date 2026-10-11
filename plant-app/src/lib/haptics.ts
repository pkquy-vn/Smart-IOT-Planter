import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Haptics are a nice-to-have; never let them break anything (and skip them on web).
const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
};

export const tap = () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const success = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const failure = () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
