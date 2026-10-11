import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// A little shower of droplets over the sprout after a watering.
// Change `trigger` (e.g. a counter) to play it again.
const DROPS = [
  { x: -70, delay: 0, size: 14 },
  { x: -35, delay: 120, size: 18 },
  { x: 0, delay: 40, size: 22 },
  { x: 38, delay: 180, size: 16 },
  { x: 72, delay: 80, size: 13 },
  { x: -10, delay: 260, size: 12 },
  { x: 20, delay: 320, size: 15 },
];

export function SplashBurst({ trigger, height = 200 }: { trigger: number; height?: number }) {
  const [anims] = useState(() => DROPS.map(() => new Animated.Value(0)));

  useEffect(() => {
    if (!trigger) return;
    anims.forEach((a) => a.setValue(0));
    const run = Animated.parallel(
      anims.map((a, i) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 1100,
          delay: DROPS[i].delay,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    run.start();
    return () => run.stop();
  }, [trigger, anims]);

  if (!trigger) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {DROPS.map((d, i) => {
        const a = anims[i];
        return (
          <Animated.View
            key={i}
            style={[
              styles.drop,
              {
                width: d.size,
                height: d.size,
                marginLeft: d.x - d.size / 2,
                opacity: a.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
                transform: [
                  { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.75] }) },
                  { rotate: '45deg' },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // A rotated square with three round corners reads as a water drop.
  drop: {
    position: 'absolute', top: 10, left: '50%', backgroundColor: '#8EC5D6',
    borderTopLeftRadius: 0, borderTopRightRadius: 999, borderBottomLeftRadius: 999, borderBottomRightRadius: 999,
  },
});
