import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { P } from '@/lib/palette';

export type SproutMood = 'happy' | 'ok' | 'sad' | 'wet' | 'thirsty';

const ART = {
  happy: require('@/assets/images/sprout/happy.png'),
  ok: require('@/assets/images/sprout/ok.png'),
  sad: require('@/assets/images/sprout/sad.png'),
  wet: require('@/assets/images/sprout/wet.png'),
  thirsty: require('@/assets/images/sprout/thirsty.png'),
};

// The drawings have the leaf on the left, so the body sits right of the image center.
// This shifts the picture left so the BODY lands in the middle. Tweak if it still looks off.
const BODY_OFFSET = 0.055;

export function Sprout({ size = 220, mood = 'happy', name }: { size?: number; mood?: SproutMood; name?: string }) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const slump = mood === 'sad' || mood === 'thirsty';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: slump ? 2200 : 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: slump ? 2200 : 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, mood]);

  const slump = mood === 'sad' || mood === 'thirsty';
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, slump ? 2 : -6] });

  return (
    <View style={{ width: size, height: size * 1.1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', bottom: 4, width: size * 0.5, height: size * 0.05, borderRadius: size, backgroundColor: 'rgba(30,91,52,0.15)' }} />
      <Animated.View style={{ transform: [{ translateX: -size * BODY_OFFSET }, { translateY }] }}>
        <Image source={ART[mood]} style={{ width: size, height: size }} contentFit="contain" />
      </Animated.View>

      {name && (
        <View style={{ marginTop: 8, backgroundColor: P.white, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 }}>
          <Text style={{ fontWeight: '800', color: P.ink }}>{name}</Text>
        </View>
      )}
    </View>
  );
}

export function sproutMoodFor(moisturePct: number | null, hoursSinceWater: number | null, dryBelow: number, wetAbove: number): SproutMood {
  if (moisturePct == null) return 'ok';
  if (moisturePct < dryBelow) return 'thirsty';
  if (hoursSinceWater != null && hoursSinceWater > 48) return 'sad';
  if (moisturePct > wetAbove) return 'wet';
  if (moisturePct < dryBelow + 10) return 'ok';
  return 'happy';
}

export const _styles = StyleSheet.create({});
