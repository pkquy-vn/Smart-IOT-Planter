import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import type { Milestones } from '@/lib/milestones';
import { P } from '@/lib/palette';

// Happy streak, days together, and a grid of badges. Tap a badge to see what it's for.
export function MilestonesCard({ m }: { m: Milestones }) {
  const [picked, setPicked] = useState<string | null>(null);
  const badge = m.badges.find((b) => b.id === picked);
  const earned = m.badges.filter((b) => b.earned).length;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.big, { backgroundColor: P.moss }]}>
          <Text style={[styles.bigNum, { color: P.white }]}>{m.happyStreak}</Text>
          <Text style={[styles.bigLabel, { color: '#E3EBDC' }]}>happy days in a row</Text>
        </View>
        <View style={[styles.big, { backgroundColor: P.paper }]}>
          <Text style={styles.bigNum}>{m.daysTogether}</Text>
          <Text style={styles.bigLabel}>days together</Text>
        </View>
      </View>
      {m.bestStreak > m.happyStreak && <Text style={styles.best}>best streak so far: {m.bestStreak} days</Text>}

      <View style={styles.header}>
        <Text style={styles.title}>Milestones</Text>
        <Text style={styles.count}>
          {earned} of {m.badges.length}
        </Text>
      </View>
      <View style={styles.grid}>
        {m.badges.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => setPicked(picked === b.id ? null : b.id)}
            accessibilityLabel={`${b.title}${b.earned ? '' : ' (not yet)'}`}
            style={styles.badge}>
            <View style={[styles.medal, b.earned ? styles.medalOn : styles.medalOff, picked === b.id && styles.medalPicked]}>
              <Text style={[styles.mark, { color: b.earned ? P.white : P.muteLight }]}>{b.mark}</Text>
            </View>
            <Text style={[styles.badgeTitle, !b.earned && { color: P.muteLight }]} numberOfLines={2}>
              {b.title}
            </Text>
          </Pressable>
        ))}
      </View>
      {badge && (
        <Text style={styles.detail}>
          {badge.earned ? 'Earned: ' : 'Not yet: '}
          {badge.detail}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 10 },
  top: { flexDirection: 'row', gap: 10 },
  big: { flex: 1, borderRadius: 20, padding: 14 },
  bigNum: { fontSize: 30, color: P.ink },
  bigLabel: { fontSize: 12, color: P.mute },
  best: { color: P.mute, fontSize: 12, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 },
  title: { color: P.ink, fontSize: 16 },
  count: { color: P.mute, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  badge: { width: '25%', alignItems: 'center', gap: 4 },
  medal: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  medalOn: { backgroundColor: P.moss, borderColor: P.sage },
  medalOff: { backgroundColor: P.paper, borderColor: P.mist, borderStyle: 'dashed' },
  medalPicked: { transform: [{ scale: 1.08 }] },
  mark: { fontSize: 17 },
  badgeTitle: { color: P.ink, fontSize: 11, textAlign: 'center', paddingHorizontal: 2 },
  detail: { color: P.fern, fontSize: 13, textAlign: 'center' },
});
