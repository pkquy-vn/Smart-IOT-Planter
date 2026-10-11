import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

import { Text } from '@/components/text';
import type { SproutMood } from '@/lib/mood';
import { P } from '@/lib/palette';

const ART = {
  joy: require('@/assets/images/sprout/happy.png'),
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
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const slump = mood === 'sad' || mood === 'thirsty';
    // Joy hops quickly; sad and thirsty sway slowly; everything else bobs gently.
    const ms = mood === 'joy' ? 380 : slump ? 2200 : 1400;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: ms, easing: mood === 'joy' ? Easing.out(Easing.quad) : Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: ms, easing: mood === 'joy' ? Easing.in(Easing.quad) : Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob, mood]);

  const slump = mood === 'sad' || mood === 'thirsty';
  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, slump ? 2 : mood === 'joy' ? -14 : -6] });
  // A little side-to-side wiggle while hopping for joy.
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['0deg', mood === 'joy' ? '4deg' : '0deg'] });

  return (
    <View style={{ width: size, height: size * 1.1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', bottom: 4, width: size * 0.5, height: size * 0.05, borderRadius: size, backgroundColor: 'rgba(30,91,52,0.15)' }} />
      <Animated.View style={{ transform: [{ translateX: -size * BODY_OFFSET }, { translateY }, { rotate }] }}>
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

