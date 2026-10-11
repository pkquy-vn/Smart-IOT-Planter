import { useEffect, useState } from 'react';
import { Animated, type DimensionValue, type ViewStyle } from 'react-native';

// Softly pulsing placeholder shown while the first reading loads.
export function Skeleton({ width, height, radius = 10, color = 'rgba(255,255,255,0.35)', style }: {
  width: DimensionValue;
  height: number;
  radius?: number;
  color?: string;
  style?: ViewStyle;
}) {
  const [pulse] = useState(() => new Animated.Value(0.4));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: color, opacity: pulse }, style]} />;
}
