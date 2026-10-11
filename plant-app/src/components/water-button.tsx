import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { CONFIG } from '@/lib/config';
import { failure, success, tap } from '@/lib/haptics';
import { P } from '@/lib/palette';

type Phase = 'idle' | 'sending' | 'pumping' | 'cooldown';

// Counts down `ms`, reporting whole seconds left, then calls `done`. Returns a cancel function.
function startCountdown(ms: number, tick: (seconds: number) => void, done: () => void) {
  const end = Date.now() + ms;
  tick(Math.ceil(ms / 1000));
  const id = setInterval(() => {
    const remaining = end - Date.now();
    if (remaining <= 0) {
      clearInterval(id);
      done();
    } else {
      tick(Math.ceil(remaining / 1000));
    }
  }, 250);
  return () => clearInterval(id);
}

// Big "Water plant" button that shows the pump running, then a cooldown countdown.
// `pumpRunning` comes from the planter, so it also lights up when the pump was started elsewhere.
export function WaterButton({ onWater, pumpRunning = false }: { onWater: () => Promise<void>; pumpRunning?: boolean }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [progress] = useState(() => new Animated.Value(0));
  const cancel = useRef<(() => void) | null>(null);

  // Stop any running countdown if the screen goes away
  useEffect(() => () => cancel.current?.(), []);

  const countdown = (ms: number, next: () => void) => {
    cancel.current?.();
    cancel.current = startCountdown(ms, setSecondsLeft, next);
  };

  const press = async () => {
    if (phase !== 'idle' || pumpRunning) return;
    tap();
    setNote(null);
    setPhase('sending');

    try {
      await onWater();
    } catch (e: any) {
      failure();
      setNote({ ok: false, text: e?.message ?? 'Could not water :(' });
      setPhase('idle');
      return;
    }

    success();
    setPhase('pumping');
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: CONFIG.PUMP_ON_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    countdown(CONFIG.PUMP_ON_MS, () => {
      setNote({ ok: true, text: 'Watered!' });
      setPhase('cooldown');
      countdown(CONFIG.PUMP_COOLDOWN_MS, () => setPhase('idle'));
    });
  };

  const autoRunning = phase === 'idle' && pumpRunning;
  const label =
    phase === 'sending'
      ? 'Starting pump…'
      : phase === 'pumping'
        ? `Watering… ${secondsLeft}s`
        : phase === 'cooldown'
          ? `Ready again in ${secondsLeft}s`
          : autoRunning
            ? 'Pump is running…'
            : 'Water plant';
  const cooling = phase === 'cooldown';
  const disabled = phase !== 'idle' || pumpRunning;
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={press}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, busy: phase === 'sending' || phase === 'pumping' || autoRunning }}
        style={({ pressed }) => [
          styles.button,
          (cooling || autoRunning) && styles.buttonCooling,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}>
        {phase === 'pumping' && <Animated.View style={[styles.fill, { width }]} />}
        <Text style={[styles.text, (cooling || autoRunning) && styles.textCooling]}>{label}</Text>
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
  text: { color: P.white, fontSize: 18, fontWeight: '800' },
  textCooling: { color: P.forest },
  note: { textAlign: 'center', fontWeight: '700' },
});
