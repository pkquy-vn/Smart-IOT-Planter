import { Pressable, StyleSheet, View } from 'react-native';

import { PlantArt } from '@/components/plant-art';
import { Text } from '@/components/text';
import { P } from '@/lib/palette';
import { PLANT_TYPE_IDS, PLANT_TYPES, type PlantTypeId } from '@/lib/plants';

// Two-column grid of picture cards. The picked one gets a moss outline and a check mark.
export function PlantTypePicker({ value, onChange }: { value: PlantTypeId; onChange: (id: PlantTypeId) => void }) {
  return (
    <View style={styles.grid}>
      {PLANT_TYPE_IDS.map((id) => {
        const t = PLANT_TYPES[id];
        const on = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="radio"
            accessibilityLabel={t.label}
            accessibilityState={{ checked: on }}
            style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && { transform: [{ scale: 0.98 }] }]}>
            <View style={[styles.art, on && styles.artOn]}>
              <PlantArt type={id} size={96} />
            </View>
            <Text style={styles.label}>{t.label}</Text>
            {on && (
              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  card: {
    width: '48.5%', backgroundColor: P.white, borderRadius: 22, padding: 10, paddingBottom: 14, gap: 2,
    borderWidth: 2, borderColor: P.white, alignItems: 'center',
  },
  cardOn: { borderColor: P.moss },
  art: { width: '100%', alignItems: 'center', backgroundColor: P.paper, borderRadius: 16, paddingVertical: 8, marginBottom: 6 },
  artOn: { backgroundColor: P.mist },
  check: {
    position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12,
    backgroundColor: P.moss, alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: P.white, fontSize: 14, lineHeight: 18 },
  label: { color: P.ink, fontSize: 15, textAlign: 'center' },
});
