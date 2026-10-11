import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionFields, f, SwitchRow, type SetField } from '@/components/form';
import { PlantTypePicker } from '@/components/plant-type-picker';
import { Text, TextInput } from '@/components/text';
import { askToNotify } from '@/lib/notify';
import { P } from '@/lib/palette';
import { PLANT_TYPES } from '@/lib/plants';
import { useSettings } from '@/lib/settings';
import { useTour } from '@/lib/tour';

export default function SettingsScreen() {
  const { loaded, profile } = useSettings();
  // Remount the form once saved settings have loaded, so it starts from the real values.
  return <SettingsForm key={`${loaded}-${profile.setupDone}`} />;
}

function SettingsForm() {
  const { profile, save, resetApp } = useSettings();
  const tour = useTour();
  const [form, setForm] = useState(profile);
  const [showAdvanced, setShowAdvanced] = useState(profile.thirstyBelow !== '');
  const [savedMsg, setSavedMsg] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const set: SetField = (k, v) => {
    setSavedMsg(false);
    setForm((prev) => ({ ...prev, [k]: v }));
  };
  const dirty = JSON.stringify(form) !== JSON.stringify(profile);
  const valid = form.name.trim().length > 0 && (form.useMock || form.sensorIp.trim().length > 0);
  const typeDefault = PLANT_TYPES[form.plantType].dryBelow;

  const onSave = () => {
    const p = { ...form, name: form.name.trim(), setupDone: true };
    save(p);
    setForm(p);
    setSavedMsg(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={f.section}>Your plant</Text>
          <Text style={f.label}>Plant name</Text>
          <TextInput style={f.input} value={form.name} onChangeText={(v) => set('name', v)} />

          <Text style={f.label}>Kind of plant</Text>
          <PlantTypePicker value={form.plantType} onChange={(id) => set('plantType', id)} />

          <Text style={f.label}>Species (optional)</Text>
          <TextInput
            style={f.input}
            placeholder={`e.g. ${PLANT_TYPES[form.plantType].examples.split(',')[0]}`}
            placeholderTextColor={P.muteLight}
            value={form.species}
            onChangeText={(v) => set('species', v)}
          />

          <Pressable onPress={() => setShowAdvanced((v) => !v)} style={styles.advancedRow}>
            <Text style={styles.advancedText}>Advanced: thirsty level</Text>
            <Text style={styles.chev}>{showAdvanced ? '–' : '+'}</Text>
          </Pressable>
          {showAdvanced && (
            <View style={styles.advanced}>
              <Text style={f.hint}>
                The app calls your plant thirsty when the soil moisture drops below this level. We pick it from the kind of
                plant ({typeDefault}% for {PLANT_TYPES[form.plantType].label}), so most people never need to
                change it.
              </Text>
              <TextInput
                style={f.input}
                placeholder={`${typeDefault} (recommended)`}
                placeholderTextColor={P.muteLight}
                keyboardType="number-pad"
                value={form.thirstyBelow}
                onChangeText={(v) => set('thirstyBelow', v.replace(/[^0-9]/g, '').slice(0, 2))}
              />
              {form.thirstyBelow !== '' && (
                <Pressable onPress={() => set('thirstyBelow', '')}>
                  <Text style={styles.link}>Use the recommended level ({typeDefault}%)</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={f.divider} />
          <Text style={f.section}>Planter connection</Text>
          <ConnectionFields form={form} set={set} />

          <View style={f.divider} />
          <Text style={f.section}>App</Text>
          <SwitchRow
            title="Thirsty alerts"
            hint="Get a notification when your plant needs water (while the app is open)."
            value={form.alerts}
            onChange={async (v) => {
              set('alerts', v);
              if (v) await askToNotify();
            }}
          />
          <View style={[f.switchRow, { justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={f.switchTitle}>Units</Text>
              <Text style={f.hint}>{form.units === 'imperial' ? '°F, fl oz and inches' : '°C, ml and centimeters'}</Text>
            </View>
            <View style={styles.segment}>
              {(['imperial', 'metric'] as const).map((u) => (
                <Pressable key={u} onPress={() => set('units', u)} style={[styles.segBtn, form.units === u && styles.segOn]}>
                  <Text style={[styles.segText, form.units === u && { color: P.white }]}>{u}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={() => {
              router.navigate('/');
              tour.restart();
            }}
            style={f.secondary}>
            <Text style={f.secondaryText}>Show tips again</Text>
          </Pressable>

          <Pressable onPress={onSave} disabled={!dirty || !valid} style={[f.primary, (!dirty || !valid) && { opacity: 0.4 }]}>
            <Text style={f.primaryText}>Save changes</Text>
          </Pressable>
          {savedMsg && !dirty && <Text style={[f.testMsg, { color: P.fern, marginTop: 6 }]}>Saved!</Text>}
          {!valid && <Text style={[f.testMsg, { color: P.alert, marginTop: 6 }]}>Add a plant name and planter IP to save.</Text>}

          <View style={f.divider} />
          <Pressable
            onPress={() => (confirmReset ? resetApp() : setConfirmReset(true))}
            style={[styles.danger, confirmReset && { backgroundColor: P.alert }]}>
            <Text style={[styles.dangerText, confirmReset && { color: P.white }]}>
              {confirmReset ? 'Tap again to erase everything' : 'Start over'}
            </Text>
          </Pressable>
          <Text style={[f.hint, { textAlign: 'center' }]}>Clears your plant, journal and history on this device.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  content: { padding: 20, gap: 8, paddingBottom: 80, width: '100%', maxWidth: 720, alignSelf: 'center' },
  advancedRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14,
    backgroundColor: P.white, padding: 14, borderRadius: 14,
  },
  advancedText: { fontWeight: '700', color: P.ink, fontSize: 15 },
  chev: { fontSize: 20, color: P.muteLight, fontWeight: '700' },
  advanced: { gap: 8, paddingHorizontal: 4 },
  link: { color: P.moss, fontWeight: '700', paddingVertical: 4 },
  segment: { flexDirection: 'row', backgroundColor: P.mist, borderRadius: 14, padding: 3 },
  segBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 11 },
  segOn: { backgroundColor: P.moss },
  segText: { color: P.mute, fontSize: 14 },
  danger: { borderRadius: 40, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: P.alert },
  dangerText: { color: P.alert, fontWeight: '700', fontSize: 16 },
});
