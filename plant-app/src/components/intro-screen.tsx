import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlantBall } from '@/components/plant-ball';
import { P } from '@/lib/palette';

// A calm little garden: green buddies sitting on a hill with leaves drifting down.
const LEAVES = [
  { w: 22, top: 40, left: 40, deg: -30 },
  { w: 14, top: 92, left: 96, deg: 40 },
  { w: 26, top: 58, right: 50, deg: 150 },
  { w: 16, top: 130, right: 34, deg: -60 },
  { w: 12, top: 170, left: 60, deg: 20 },
];

export function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.art}>
        {LEAVES.map((l, i) => (
          <View
            key={i}
            style={[styles.leaf, { width: l.w, height: l.w * 0.55, top: l.top, left: l.left, right: l.right, transform: [{ rotate: `${l.deg}deg` }] }]}
          />
        ))}

        <View style={styles.hillBack} />
        <View style={styles.hillFront} />
        <View style={styles.family}>
          <View style={{ marginRight: -10 }}>
            <PlantBall size={84} mood="ok" accessory="twin" />
          </View>
          <PlantBall size={160} mood="happy" accessory="leaf" />
          <View style={{ marginLeft: -8 }}>
            <PlantBall size={70} mood="happy" accessory="bud" />
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.brand}>splash</Text>
        <Text style={styles.tag}>your plant, managed from your phone</Text>
        <Pressable onPress={onStart} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.btnText}>start !</Text>
        </Pressable>
        <Text style={styles.fine}>track your plant, check its moisture, and water it all from here!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  art: { flex: 1, margin: 14, borderRadius: 36, backgroundColor: '#E3ECDD', overflow: 'hidden' },
  leaf: { position: 'absolute', backgroundColor: '#9DC390', opacity: 0.7, borderTopLeftRadius: 30, borderBottomRightRadius: 30 },
  hillBack: { position: 'absolute', bottom: -70, left: -80, width: 320, height: 200, borderRadius: 160, backgroundColor: '#CFE0C4' },
  hillFront: { position: 'absolute', bottom: -90, right: -60, left: -40, height: 180, borderRadius: 140, backgroundColor: '#BCD4AF' },
  family: { position: 'absolute', bottom: 40, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end' },
  bottom: { alignItems: 'center', paddingHorizontal: 28, paddingBottom: 24, gap: 10 },
  brand: { fontSize: 40, fontWeight: '900', letterSpacing: 4, color: P.forest },
  tag: { fontSize: 16, color: P.mute, fontWeight: '600' },
  btn: { marginTop: 8, backgroundColor: P.moss, borderRadius: 40, paddingVertical: 18, paddingHorizontal: 54 },
  btnText: { color: P.white, fontSize: 18, fontWeight: '800' },
  fine: { textAlign: 'center', color: P.mute, fontSize: 12, marginTop: 4 },
});
