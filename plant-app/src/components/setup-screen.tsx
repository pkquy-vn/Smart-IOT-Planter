import { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Face } from '@/components/face';
import { P } from '@/lib/palette';
import { useSettings, withHttp } from '@/lib/settings';


export function SetupScreen() {
  const { profile, save } = useSettings();
  const [form, setForm] = useState(profile);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const canStart = form.name.trim().length > 0 && (form.useMock || form.sensorIp.trim().length > 0);

  const testConnection = async () => {
    if (form.useMock) return setTestMsg({ ok: true, text: 'Demo mode: no hardware needed.' });
    if (!form.sensorIp.trim()) return setTestMsg({ ok: false, text: 'Enter the planter IP first.' });
    setTesting(true);
    setTestMsg(null);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const res = await fetch(`${withHttp(form.sensorIp.trim())}/status`, { signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setTestMsg({ ok: true, text: `Connected! Moisture ${Math.round(data.moisture)}%` });
    } catch {
      setTestMsg({
        ok: false,
        text: "Couldn't connect. Same Wi-Fi as the planter? Is the IP right?",
      });
    } finally {
      clearTimeout(timer);
      setTesting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Set up your plant</Text>
          <Text style={styles.sub}>Tell us about your plant, then connect it to planter!!</Text>

          <Text style={styles.label}>Plant name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => set('name', v)}
          />

          <Text style={styles.label}>Species (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.species}
            onChangeText={(v) => set('species', v)}
          />

          <Text style={styles.label}>Call it thirsty below (% moisture)</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            keyboardType="number-pad"
            value={form.thirstyBelow}
            onChangeText={(v) => set('thirstyBelow', v.replace(/[^0-9]/g, ''))}
          />
          <Text style={styles.hint}>Check your plant's care info. Most houseplants like 30–60%.</Text>

          <Text style={styles.label}>Location (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={(v) => set('location', v)}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            multiline
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
          />

          <View style={styles.divider} />
          <Text style={styles.section}>Connect planter!</Text>

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Demo mode</Text>
              <Text style={styles.hint}>Use fake data until the hardware is ready.</Text>
            </View>
            <Switch value={form.useMock} onValueChange={(v) => set('useMock', v)} trackColor={{ true: P.moss }} />
          </View>

          {!form.useMock && (
            <>
              <Text style={styles.label}>Planter IP (sensors + pump)</Text>
              <TextInput
                style={styles.input}
                placeholder="192.168.1.50"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                value={form.sensorIp}
                onChangeText={(v) => set('sensorIp', v)}
              />
              <Text style={styles.label}>Camera IP (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="192.168.1.51"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numbers-and-punctuation"
                value={form.cameraIp}
                onChangeText={(v) => set('cameraIp', v)}
              />
              <Text style={styles.hint}>Your hardware teammates can read these from the Serial Monitor.</Text>
            </>
          )}

          <Pressable onPress={testConnection} disabled={testing} style={styles.secondary}>
            <Text style={styles.secondaryText}>{testing ? 'Testing…' : 'Test connection'}</Text>
          </Pressable>
          {testMsg && (
            <Text style={[styles.testMsg, { color: testMsg.ok ? P.fern : P.alert }]}>{testMsg.text}</Text>
          )}

          <Pressable
            onPress={() => save({ ...form, name: form.name.trim() })}
            disabled={!canStart}
            style={[styles.primary, !canStart && { opacity: 0.4 }]}>
            <Text style={styles.primaryText}>Start growing →</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  content: { padding: 20, gap: 8, paddingBottom: 60 },
  emoji: { fontSize: 48, textAlign: 'center', marginTop: 8 },
  title: { fontSize: 30, fontWeight: '900', color: P.ink, textAlign: 'center' },
  sub: { color: P.mute, textAlign: 'center', marginBottom: 12 },
  label: { fontWeight: '700', color: P.ink, marginTop: 10 },
  section: { fontSize: 20, fontWeight: '800', color: P.ink },
  input: {
    backgroundColor: P.white, borderRadius: 18, padding: 14, fontSize: 16,
    borderWidth: 1, borderColor: P.mist, color: P.ink,
  },
  hint: { color: P.mute, fontSize: 13 },
  divider: { height: 1, backgroundColor: P.mist, marginVertical: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: P.white, padding: 14, borderRadius: 14 },
  switchTitle: { fontWeight: '700', color: P.ink, fontSize: 16 },
  secondary: {
    marginTop: 14, borderRadius: 40, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: P.moss,
  },
  secondaryText: { color: P.moss, fontWeight: '700', fontSize: 16 },
  testMsg: { textAlign: 'center', fontWeight: '600' },
  primary: { marginTop: 18, backgroundColor: P.moss, borderRadius: 40, paddingVertical: 18, alignItems: 'center' },
  primaryText: { color: P.white, fontSize: 18, fontWeight: '700' },
});
