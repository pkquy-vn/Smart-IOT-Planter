import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

// The whole app uses Gaegu Bold (loaded in app/_layout.tsx). React Native has no global font
// setting, so every screen imports Text / TextInput from here instead of from react-native.
export const FONT = 'Gaegu_700Bold';

// Gaegu runs small next to the system font, so sizes are nudged up to read the same.
const SCALE = 1.15;

function withFont(style: StyleProp<TextStyle>): TextStyle {
  // fontWeight is dropped: the font is already bold, and extra weight makes browsers fake-bold it.
  const { fontWeight: _weight, fontFamily: _family, ...flat } = StyleSheet.flatten(style) ?? {};
  return {
    ...flat,
    fontFamily: FONT,
    fontSize: (flat.fontSize ?? 14) * SCALE,
    ...(flat.lineHeight ? { lineHeight: flat.lineHeight * SCALE } : null),
  };
}

export function Text({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={withFont(style)} />;
}

export function TextInput({ style, ...rest }: TextInputProps) {
  return <RNTextInput {...rest} style={withFont(style)} />;
}
