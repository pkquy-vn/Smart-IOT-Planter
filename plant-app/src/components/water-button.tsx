import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { failure, success, tap } from '@/lib/haptics';
import { P } from '@/lib/palette';
import { PUMP_ON_MS } from '@/lib/pump';

type Phase = 'idle' | 'sending' | 'pumping';

// 125000 ms -> "2:05", 9000 -> "9s"
const formatWait = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
};

// Big "Water plant" button that shows the pump running, then the planter's cooldown.
// `pumpRunning` and `cooldownUntil` come from the planter, so they also reflect waterings started elsewhere.
// `soaked` asks for a second tap first, since a pump run can't be undone.
export function WaterButton({
  onWater,
  pumpRunning = false,
  cooldownUntil = 0,
  soaked = false,
}: {
  onWater: () => Promise<void>;
  pumpRunning?: boolean;
  cooldownUntil?: number; // epoch ms
  soaked?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [progress] = useState(() => new Animated.Value(0));
  const pumpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop the pumping timer if the screen goes away
  useEffect(
    () => () => {
      if (pumpTimer.current) clearTimeout(pumpTimer.current);
    },
    [],
  );

  // Tick the cooldown countdown while there is one.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  const press = () => {
    if (phase !== 'idle' || pumpRunning) return;
    if (soaked) {
      tap();
      setNote(null);
      setConfirming(true);
      return;
    }
    start();
  };

  const start = async () => {
    setConfirming(false);
    tap();
    setNote(null);
    setPhase('sending');

    try {
      await onWater();
    } catch (e: unknown) {
      failure();
      setNote({ ok: false, text: e instanceof Error ? e.message : 'Could not water :(' });
      setPhase('idle');
      return;
    }

    success();
    setPhase('pumping');
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: PUMP_ON_MS, easing: Easing.linear, useNativeDriver: false }).start();
    pumpTimer.current = setTimeout(() => {
      setNote({ ok: true, text: 'Watered!' });
      setPhase('idle');
    }, PUMP_ON_MS);
  };

  if (confirming) {
    return (
      <View style={styles.confirm}>
        <Text style={styles.confirmTitle}>Your plant is already soaked</Text>
        <Text style={styles.confirmText}>Too much water can rot the roots. Water anyway?</Text>
        <View style={styles.confirmRow}>
          <Pressable onPress={() => setConfirming(false)} style={[styles.choice, styles.choiceGhost]}>
            <Text style={[styles.choiceText, { color: P.moss }]}>no, skip it</Text>
          </Pressable>
          <Pressable onPress={start} style={[styles.choice, styles.choiceSolid]}>
            <Text style={styles.choiceText}>water anyway</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const waitMs = cooldownUntil - now;
  const cooling = phase === 'idle' && !pumpRunning && waitMs > 0;
  const busyElsewhere = phase === 'idle' && pumpRunning;
  const label =
    phase === 'sending'
      ? 'Starting pump…'
      : phase === 'pumping'
        ? 'Watering…'
        : busyElsewhere
          ? 'Pump is running…'
          : cooling
            ? `Next watering in ${formatWait(waitMs)}`
            : 'Water plant';
  const muted = cooling || busyElsewhere;
  const disabled = phase !== 'idle' || pumpRunning || cooling;
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={press}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, busy: phase !== 'idle' || busyElsewhere }}
        style={({ pressed }) => [styles.button, muted && styles.buttonCooling, pressed && { transform: [{ scale: 0.98 }] }]}>
        {phase === 'pumping' && <Animated.View style={[styles.fill, { width }]} />}
        <Text style={[styles.text, muted && styles.textCooling]}>{label}</Text>
      </Pressable>
      {note && <Text style={[styles.note, { color: note.ok ? P.fern : P.alert }]}>{note.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  button: {
    backgroundColor: P.moss, borderRadius: 40, paddingVertical: 20, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  buttonCooling: { backgroundColor: P.sage },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: P.fern },
  text: { color: P.white, fontSize: 18 },
  textCooling: { color: P.forest },
  note: { textAlign: 'center' },
  confirm: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 6, borderWidth: 2, borderColor: P.sage },
  confirmTitle: { color: P.ink, fontSize: 17, textAlign: 'center' },
  confirmText: { color: P.mute, fontSize: 14, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  choice: { flex: 1, borderRadius: 30, paddingVertical: 14, alignItems: 'center' },
  choiceGhost: { borderWidth: 2, borderColor: P.moss },
  choiceSolid: { backgroundColor: P.moss },
  choiceText: { color: P.white, fontSize: 16 },
});
