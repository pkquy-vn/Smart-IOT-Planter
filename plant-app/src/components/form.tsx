import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { P } from '@/lib/palette';
import { probeBoard } from '@/lib/api';
import { DEFAULT_PLANTER_IP, withHttp } from '@/lib/config';
import type { Profile } from '@/lib/profile';

// Shared bits for the setup screen and the Settings page.

// Moss track with a white knob. activeThumbColor is web-only (react-native-web), hence the cast.
export const SWITCH_COLORS = {
  trackColor: { true: P.moss, false: P.muteLight },
  thumbColor: P.white,
  activeThumbColor: P.white,
} as object;

export type SetField = <K extends keyof Profile>(k: K, v: Profile[K]) => void;

export function SwitchRow({ title, hint, value, onChange }: { title: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={f.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={f.switchTitle}>{title}</Text>
        {hint ? <Text style={f.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} {...SWITCH_COLORS} />
    </View>
  );
}

// Demo mode, planter IPs and test connection.
export function ConnectionFields({ form, set }: { form: Profile; set: SetField }) {
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    if (form.useMock) return setTestMsg({ ok: true, text: 'Demo mode: no hardware needed.' });
    if (!form.sensorIp.trim()) return setTestMsg({ ok: false, text: 'Enter the planter IP first.' });
    setTesting(true);
    setTestMsg(null);
    try {
      const data = await probeBoard(withHttp(form.sensorIp.trim()));
      setTestMsg({ ok: true, text: `Connected! Moisture ${Math.round(data.moisture)}%${data.cameraReady === false ? ' (no camera)' : ''}` });
    } catch {
      setTestMsg({ ok: false, text: "Couldn't connect. Same Wi-Fi as the planter? Is the IP right?" });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <SwitchRow
        title="Demo mode"
        hint="Use fake data until the hardware is ready."
        value={form.useMock}
        onChange={(v) => {
          set('useMock', v);
          if (!v && !form.sensorIp.trim()) set('sensorIp', DEFAULT_PLANTER_IP);
        }}
      />

      {!form.useMock && (
        <>
          <Text style={f.label}>Planter IP (sensors + pump)</Text>
          <TextInput
            style={f.input}
            placeholder={DEFAULT_PLANTER_IP}
            placeholderTextColor={P.muteLight}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            value={form.sensorIp}
            onChangeText={(v) => set('sensorIp', v)}
          />
          <Text style={f.label}>Camera IP (optional)</Text>
          <TextInput
            style={f.input}
            placeholder="Same as the planter"
            placeholderTextColor={P.muteLight}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            value={form.cameraIp}
            onChangeText={(v) => set('cameraIp', v)}
          />
          <Text style={f.hint}>Your hardware teammates can read these from the Serial Monitor.</Text>
        </>
      )}

      <Pressable onPress={testConnection} disabled={testing} style={f.secondary}>
        <Text style={f.secondaryText}>{testing ? 'Testing…' : 'Test connection'}</Text>
      </Pressable>
      {testMsg && <Text style={[f.testMsg, { color: testMsg.ok ? P.fern : P.alert }]}>{testMsg.text}</Text>}
    </>
  );
}

export const f = StyleSheet.create({
  label: { fontWeight: '700', color: P.ink, marginTop: 10 },
  section: { fontSize: 20, fontWeight: '800', color: P.ink },
  input: {
    backgroundColor: P.white, borderRadius: 18, padding: 14, fontSize: 16,
    borderWidth: 1, borderColor: P.mist, color: P.ink,
  },
  hint: { color: P.mute, fontSize: 13 },
  divider: { height: 1, backgroundColor: P.mist, marginVertical: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: P.white, padding: 14, borderRadius: 14, marginTop: 8 },
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
