import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlantBall } from '@/components/plant-ball';
import { dayKey, eventsByDay, moodFor } from '@/lib/dates';
import { P } from '@/lib/palette';
import { useSettings } from '@/lib/settings';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const { events, addEvent, profile } = useSettings();
  const { width } = useWindowDimensions();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  const byDay = useMemo(() => eventsByDay(events), [events]);
  const cell = Math.min(width - 32, 560) / 7;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lead = new Date(year, month, 1).getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const inMonth = events.filter((e) => {
    const d = new Date(e.t);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const dayCount = (kind: 'water' | 'dry') => new Set(inMonth.filter((e) => e.kind === kind).map((e) => dayKey(new Date(e.t)))).size;
  const waterings = inMonth.filter((e) => e.kind === 'water').length;
  const thirsty = dayCount('dry');

  const lastWater = events.filter((e) => e.kind === 'water').map((e) => e.t);
  const sinceDays = lastWater.length
    ? Math.floor((Date.now() - Math.max(...lastWater)) / 86400000)
    : null;

  const selEvents = (byDay[dayKey(selected)] ?? []).sort((a, b) => a.t - b.t);
  const selLabel = selected.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const sameDay = (a: Date, b: Date) => dayKey(a) === dayKey(b);

  const shift = (n: number) => setCursor(new Date(year, month + n, 1));

  const selMood = moodFor(selected, byDay, today);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{profile.name ? `${profile.name}'s journal` : 'Plant journal'}</Text>

        <View style={styles.monthRow}>
          <Pressable onPress={() => shift(-1)} hitSlop={12} style={styles.arrow}>
            <Text style={styles.arrowText}>‹</Text>
          </Pressable>
          <Text style={styles.month}>
            {cursor.toLocaleDateString([], { month: 'short', year: 'numeric' })}
          </Text>
          <Pressable onPress={() => shift(1)} hitSlop={12} style={styles.arrow}>
            <Text style={styles.arrowText}>›</Text>
          </Pressable>
        </View>

        <View style={{ alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            {DOW.map((d) => (
              <Text key={d} style={[styles.dow, { width: cell }]}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: cell * 7 }}>
            {cells.map((d, i) =>
              d ? (
                <Pressable key={i} onPress={() => setSelected(d)} style={{ width: cell, alignItems: 'center', paddingVertical: 6 }}>
                  <View style={[styles.ballWrap, sameDay(d, selected) && styles.ballSel]}>
                    <PlantBall size={cell * 0.74} mood={moodFor(d, byDay, today)} />
                  </View>
                  <View style={[styles.num, sameDay(d, today) && styles.numToday]}>
                    <Text style={[styles.numText, sameDay(d, today) && { color: P.white }]}>{d.getDate()}</Text>
                  </View>
                </Pressable>
              ) : (
                <View key={i} style={{ width: cell }} />
              ),
            )}
          </View>
        </View>

        <View style={styles.legend}>
          {(['happy', 'ok', 'sad'] as const).map((m) => (
            <View key={m} style={styles.legendItem}>
              <PlantBall size={22} mood={m} />
              <Text style={styles.legendText}>{m === 'happy' ? 'Watered' : m === 'ok' ? 'Fine' : 'Thirsty'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: P.moss }]}>
            <Text style={[styles.statNum, { color: P.white }]}>{waterings}</Text>
            <Text style={[styles.statLabel, { color: '#E3EBDC' }]}>Waterings</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{thirsty}</Text>
            <Text style={styles.statLabel}>Thirsty days</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{sinceDays === null ? '–' : sinceDays}</Text>
            <Text style={styles.statLabel}>Days since water</Text>
          </View>
        </View>

        <View style={styles.detail}>
          <PlantBall size={56} mood={selMood} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.detailTitle}>{selLabel}</Text>
            {selEvents.length === 0 ? (
              <Text style={styles.detailText}>Nothing logged.</Text>
            ) : (
              selEvents.map((e, i) => (
                <Text key={i} style={styles.detailText}>
                  {e.kind === 'water' ? '💧 Watered' : '🥀 Soil got dry'} ·{' '}
                  {new Date(e.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
              ))
            )}
          </View>
        </View>

        <Pressable onPress={() => addEvent('water')} style={({ pressed }) => [styles.logBtn, pressed && { opacity: 0.8 }]}>
          <Text style={styles.logText}>+  Log a watering today</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  content: { padding: 16, gap: 16, paddingBottom: 120, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { alignSelf: 'center', color: P.mute, fontWeight: '700', fontSize: 14, marginTop: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  month: { fontSize: 26, fontWeight: '800', color: P.forest, minWidth: 140, textAlign: 'center' },
  arrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 26, fontWeight: '700', color: P.muteLight, marginTop: -3 },
  dow: { textAlign: 'center', color: P.muteLight, fontWeight: '600', fontSize: 13 },
  ballWrap: { borderRadius: 999, padding: 2, borderWidth: 2, borderColor: 'transparent' },
  ballSel: { borderColor: P.moss },
  num: { marginTop: 4, minWidth: 26, height: 20, paddingHorizontal: 7, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numToday: { backgroundColor: P.moss },
  numText: { fontSize: 12, fontWeight: '700', color: P.mute },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: P.mute, fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: 22, padding: 14, gap: 2, backgroundColor: P.white },
  statNum: { fontSize: 30, fontWeight: '900', color: P.ink },
  statLabel: { fontSize: 11, fontWeight: '700', color: P.mute },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: P.white, borderRadius: 22, padding: 16 },
  detailTitle: { fontWeight: '900', fontSize: 16, color: P.ink },
  detailText: { color: P.mute, fontSize: 14 },
  logBtn: { backgroundColor: P.moss, borderRadius: 40, paddingVertical: 18, alignItems: 'center' },
  logText: { color: P.white, fontSize: 16, fontWeight: '800' },
});
