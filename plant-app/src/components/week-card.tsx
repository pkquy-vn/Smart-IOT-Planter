import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PlantBall } from '@/components/plant-ball';
import { Text } from '@/components/text';
import { eventsByDay, moodFor } from '@/lib/dates';
import { P } from '@/lib/palette';
import { useSettings } from '@/lib/settings';

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Mon–Sun row of little plant faces: watered, fine or thirsty.
export function WeekCard() {
  const { events } = useSettings();
  const byDay = useMemo(() => eventsByDay(events), [events]);
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>This week</Text>
      <View style={styles.row}>
        {WEEK.map((label, i) => {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + i);
          const isToday = i === mondayOffset;
          return (
            <View key={label} style={styles.day}>
              <PlantBall size={38} mood={moodFor(d, byDay, today)} />
              <Text style={[styles.label, isToday && styles.today]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 12 },
  title: { color: P.ink, fontSize: 16, fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 6 },
  label: { color: P.muteLight, fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  today: { backgroundColor: P.moss, color: P.white },
});
