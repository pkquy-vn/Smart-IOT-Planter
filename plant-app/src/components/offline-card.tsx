import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { P } from '@/lib/palette';

// Shown on Home when the planter stops answering: what to check, and a button to try again.
export function OfflineCard({ onRetry, hasOldReadings, boardUrl }: { onRetry: () => Promise<void>; hasOldReadings: boolean; boardUrl: string }) {
  const [checking, setChecking] = useState(false);
  const ip = boardUrl.replace(/^https?:\/\//, '');

  const retry = async () => {
    setChecking(true);
    await onRetry();
    setChecking(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Can’t find your planter</Text>
      {hasOldReadings && <Text style={styles.sub}>The readings below are from the last time it answered.</Text>}
      <View style={styles.steps}>
        <Text style={styles.step}>1. Make sure the planter is plugged in</Text>
        <Text style={styles.step}>2. Join the SmartPlanter_AP Wi-Fi on this phone</Text>
        <Text style={styles.step}>3. Check the planter IP in Settings (now {ip})</Text>
      </View>
      <Pressable onPress={retry} disabled={checking} style={({ pressed }) => [styles.btn, (pressed || checking) && { opacity: 0.7 }]}>
        <Text style={styles.btnText}>{checking ? 'checking…' : 'try again'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 6, borderWidth: 2, borderColor: P.blush },
  title: { color: P.ink, fontSize: 17 },
  sub: { color: P.mute, fontSize: 13 },
  steps: { gap: 2, marginTop: 4 },
  step: { color: P.ink, fontSize: 14 },
  btn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: P.moss, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8 },
  btnText: { color: P.white, fontSize: 15 },
});
