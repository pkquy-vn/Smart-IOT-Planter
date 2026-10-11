import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { useNow } from '@/hooks/use-now';
import type { PlantEvent } from '@/lib/dates';
import { P } from '@/lib/palette';
import { everyLabel, formatWater, PLANT_TYPES, recommend, tipFor, type PlantTypeId, type Units } from '@/lib/plants';

// Presses within this window count as one watering session ("2 of 3 presses done").
const SESSION_MS = 30 * 60 * 1000;

// How much and how often to water this kind of plant, in presses of the Water button.
export function CareCard({
  plantType,
  units,
  dryBelow,
  moisture,
  events,
}: {
  plantType: PlantTypeId;
  units: Units;
  dryBelow: number;
  moisture: number | null;
  events: PlantEvent[];
}) {
  const type = PLANT_TYPES[plantType];
  const rec = recommend(plantType);
  const now = useNow(30000);
  const waters = events.filter((e) => e.kind === 'water');
  const sessionPresses = waters.filter((e) => now - e.t < SESSION_MS).length;
  const weekPresses = waters.filter((e) => now - e.t < 7 * 86400000).length;

  const thirsty = moisture != null && moisture < dryBelow;
  const soggy = weekPresses > rec.pressesPerWeek * 2 && moisture != null && moisture >= dryBelow;
  const status =
    sessionPresses > 0 && sessionPresses < rec.presses
      ? { text: `${sessionPresses} of ${rec.presses} presses done. Keep going!`, color: P.fern }
      : sessionPresses >= rec.presses
        ? { text: 'Watering done. Nice work!', color: P.fern }
        : soggy
          ? { text: 'That’s a lot of water this week. Make sure the soil isn’t staying soggy.', color: P.alert }
          : thirsty
            ? { text: `Time to water: about ${rec.presses} ${rec.presses === 1 ? 'press' : 'presses'}.`, color: P.alert }
            : { text: 'No water needed right now.', color: P.mute };

  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.title}>Care guide</Text>
        <Text style={styles.sub}>{type.label}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.fact}>
          <Text style={styles.factValue}>{rec.presses}×</Text>
          <Text style={styles.factLabel}>presses per watering</Text>
        </View>
        <View style={styles.fact}>
          <Text style={styles.factValue}>{formatWater(rec.ml, units)}</Text>
          <Text style={styles.factLabel}>each time</Text>
        </View>
        <View style={styles.fact}>
          <Text style={styles.factValue}>{weekPresses}</Text>
          <Text style={styles.factLabel}>presses this week (aim ~{rec.pressesPerWeek})</Text>
        </View>
      </View>

      <Text style={styles.body}>
        Water {everyLabel(rec.everyDays)}, or whenever the soil drops below {dryBelow}%. Each press of Water runs the
        pump for {rec.secondsPerPress} seconds.
      </Text>
      <Text style={styles.tip}>{tipFor(plantType, units)}</Text>
      <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 12 },
  title: { color: P.ink, fontSize: 16, fontWeight: '800' },
  sub: { color: P.mute, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8 },
  fact: { flex: 1, backgroundColor: P.paper, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center' },
  factValue: { color: P.forest, fontSize: 20, fontWeight: '900' },
  factLabel: { color: P.mute, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  body: { color: P.ink, fontSize: 14, lineHeight: 20 },
  tip: { color: P.mute, fontSize: 13, lineHeight: 18 },
  status: { fontWeight: '800', fontSize: 14 },
});
