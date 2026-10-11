import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { CAMERA_REFRESH_MS, type PlanterConfig } from '@/lib/config';
import { P } from '@/lib/palette';

// Live picture from the planter camera, refreshed every CAMERA_REFRESH_MS.
// `cameraReady` comes from the planter's status (false when its camera failed to start).
export function CameraCard({ config, cameraReady }: { config: PlanterConfig; cameraReady: boolean }) {
  const [tick, setTick] = useState(0);
  const [ok, setOk] = useState(true);
  const [lastFrame, setLastFrame] = useState<Date | null>(null);
  const [pulse] = useState(() => new Animated.Value(1));
  const demo = config.useMock;
  const live = !demo && cameraReady;

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTick((t) => t + 1), CAMERA_REFRESH_MS);
    return () => clearInterval(id);
  }, [live]);

  // Soft blink on the LIVE dot
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const caption = demo
    ? 'Connect the planter to see your plant'
    : !cameraReady
      ? 'The planter reports no camera'
      : lastFrame
      ? `Updated ${lastFrame.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}`
      : 'Connecting…';
  const badge = demo ? 'DEMO' : live && ok ? 'LIVE' : 'NO SIGNAL';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Live view</Text>
        <View style={[styles.badge, !(live && ok) && { backgroundColor: P.muteLight }]}>
          <Animated.View style={[styles.dot, { opacity: live && ok ? pulse : 1 }]} />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      </View>

      <View style={styles.frame}>
        {!live ? (
          <Text style={styles.placeholder}>
            {demo ? 'The camera preview shows up\nonce the planter is connected' : 'No camera on the planter'}
          </Text>
        ) : (
          <Image
            source={{ uri: `${config.cameraSnapshotUrl}?t=${tick}` }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="none"
            transition={0}
            onLoad={() => {
              setOk(true);
              setLastFrame(new Date());
            }}
            onError={() => setOk(false)}
          />
        )}
      </View>

      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: P.ink, fontSize: 16, fontWeight: '800' },
  frame: {
    width: '100%', aspectRatio: 4 / 3, borderRadius: 20, backgroundColor: P.mist,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  placeholder: { color: P.mute, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: P.moss, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P.white },
  badgeText: { color: P.white, fontSize: 12, fontWeight: '800' },
  caption: { color: P.mute, fontSize: 12, textAlign: 'center' },
});
