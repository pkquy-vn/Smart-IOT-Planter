import { Colors } from '@/constants/theme';

// The screens use the fixed light palette in lib/palette.ts, so the themed
// helpers follow suit. Switch on useColorScheme() here once dark mode is designed.
export function useTheme() {
  return Colors.light;
}
