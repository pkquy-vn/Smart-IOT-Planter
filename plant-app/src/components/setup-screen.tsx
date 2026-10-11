import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionFields, f, type SetField } from '@/components/form';
import { PlantTypePicker } from '@/components/plant-type-picker';
import { Text, TextInput } from '@/components/text';
import { P } from '@/lib/palette';
import { useSettings } from '@/lib/settings';

// First-run setup: just the essentials. Everything else lives in the Settings tab.
export function SetupScreen() {
  const { profile, save } = useSettings();
  const [form, setForm] = useState(profile);

  const set: SetField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const canStart = form.name.trim().length > 0 && (form.useMock || form.sensorIp.trim().length > 0);

  const start = () => {
    const p = { ...form, name: form.name.trim() };
    // The root layout swaps onboarding for the tabs as soon as the profile is saved, landing on Home.
    save(p);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Set up your plant</Text>
          <Text style={styles.sub}>Tell us about your plant, then connect it to the planter.</Text>

          <Text style={f.label}>Plant name</Text>
          <TextInput style={f.input} value={form.name} onChangeText={(v) => set('name', v)} />

          <Text style={f.label}>What kind of plant is it?</Text>
          <PlantTypePicker value={form.plantType} onChange={(id) => set('plantType', id)} />

          <View style={f.divider} />
          <Text style={f.section}>Connect the planter</Text>
          <ConnectionFields form={form} set={set} />

          <Pressable onPress={start} disabled={!canStart} style={[f.primary, !canStart && { opacity: 0.4 }]}>
            <Text style={f.primaryText}>Start growing →</Text>
          </Pressable>
          <Text style={[f.hint, { textAlign: 'center', marginTop: 8 }]}>You can change any of this later in Settings.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  content: { padding: 20, gap: 8, paddingBottom: 60, width: '100%', maxWidth: 720, alignSelf: 'center' },
  title: { fontSize: 30, fontWeight: '900', color: P.ink, textAlign: 'center' },
  sub: { color: P.mute, textAlign: 'center', marginBottom: 12 },
});
