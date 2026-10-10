import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlantBall } from '@/components/plant-ball';
import { Sprout, sproutMoodFor } from '@/components/sprout';
import { getStatus, waterPlant, type Status } from '@/lib/api';
import { CONFIG } from '@/lib/config';
import { eventsByDay, moodFor } from '@/lib/dates';
import { P } from '@/lib/palette';
import { useSettings } from '@/lib/settings';

function moistureState(m: number) {
  if (m < CONFIG.DRY_BELOW) return { label: 'Thirsty', mood: 'sad' as const };
  if (m > CONFIG.WET_ABOVE) return { label: 'Very wet', mood: 'ok' as const };
  return { label: 'Happy', mood: 'happy' as const };
}

function CameraView() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (CONFIG.USE_MOCK) return;
    const id = setInterval(() => setTick((t) => t + 1), CONFIG.CAMERA_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.camera}>
      {CONFIG.USE_MOCK ? (
        <Text style={styles.cameraText}>Camera preview{'\n'}(demo mode)</Text>
      ) : (
        <Image
          source={{ uri: `${CONFIG.CAMERA_SNAPSHOT_URL}?t=${tick}` }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="none"
        />
      )}
      <View style={styles.liveBadge}>
        <Text style={styles.liveText}>● LIVE</Text>
      </View>
    </View>
  );
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function WeekCard() {
  const { events } = useSettings();
  const byDay = useMemo(() => eventsByDay(events), [events]);
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;

  return (
    <View style={styles.weekCard}>
      <Text style={styles.weekTitle}>This week</Text>
      <View style={styles.weekRow}>
        {WEEK.map((label, i) => {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + i);
          const isToday = i === mondayOffset;
          return (
            <View key={label} style={styles.weekDay}>
              <PlantBall size={38} mood={moodFor(d, byDay, today)} />
              <Text style={[styles.weekLabel, isToday && styles.weekLabelToday]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function Dashboard() {
  const { profile, editPlant, events, addEvent, logOncePerDay } = useSettings();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watering, setWatering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getStatus());
      setError(null);
    } catch {
      setError("Can't reach the planter. Same Wi-Fi? Check the IP in Edit plant.");
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, CONFIG.POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // A thirsty moment gets recorded on the calendar (once per day).
  useEffect(() => {
    if (profile.setupDone && status && status.moisture < CONFIG.DRY_BELOW) logOncePerDay('dry');
  }, [status, profile.setupDone, logOncePerDay]);

  const lastWatered = useMemo(() => {
    const w = events.filter((e) => e.kind === 'water');
    return w.length ? new Date(Math.max(...w.map((e) => e.t))) : null;
  }, [events]);

  const onWater = async () => {
    setWatering(true);
    setMessage(null);
    try {
      await waterPlant();
      addEvent('water');
      setMessage('Watered!');
      refresh();
    } catch (e: any) {
      setMessage(e?.message ?? 'Could not water :(');
    } finally {
      setWatering(false);
    }
  };

  if (!profile.setupDone) return <View style={styles.safe} />;

  const moisture = status?.moisture ?? 0;
  const state = moistureState(moisture);
  const hoursSinceWater = lastWatered ? (Date.now() - lastWatered.getTime()) / 3600000 : null;
  const sproutMood = sproutMoodFor(status ? moisture : null, hoursSinceWater, CONFIG.DRY_BELOW, CONFIG.WET_ABOVE);
  const moodMsg =
    sproutMood === 'sad'
      ? 'Please water me…'
      : sproutMood === 'thirsty'
        ? 'I need a drink!'
        : sproutMood === 'wet'
          ? 'Phew, soaked!'
          : sproutMood === 'happy'
            ? 'Feeling great!'
            : 'Just hanging out';
  const temp = status && status.temperature != null
    ? CONFIG.FAHRENHEIT
      ? `${Math.round((status.temperature * 9) / 5 + 32)}°`
      : `${status.temperature.toFixed(1)}°`
    : '--';
  const sub = [profile.species, profile.location].filter(Boolean).join(' · ') || 'check on your plant!';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>hello, {profile.name} !</Text>
            <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
          </View>
          <Pressable onPress={editPlant} style={styles.editBtn}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.stage}>
          <Sprout size={200} mood={sproutMood} />
          <Text style={styles.moodMsg}>{moodMsg}</Text>
        </View>

        <WeekCard />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.row}>
          <View style={[styles.tile, { backgroundColor: P.moss }]}>
            <Text style={styles.tileLabel}>Moisture</Text>
            <Text style={styles.tileValue}>{status ? `${Math.round(moisture)}%` : '--'}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${Math.min(100, moisture)}%` }]} />
            </View>
            <Text style={styles.tileFoot}>{status ? state.label : 'Connecting…'}</Text>
          </View>
          <View style={[styles.tile, { backgroundColor: P.white }]}>
            <Text style={[styles.tileLabel, { color: P.mute }]}>Temperature</Text>
            <Text style={[styles.tileValue, { color: P.ink }]}>{temp}</Text>
            <Text style={[styles.tileFoot, { color: P.mute }]}>{CONFIG.FAHRENHEIT ? 'Fahrenheit' : 'Celsius'}</Text>
          </View>
        </View>

        <CameraView />

        <Pressable
          onPress={onWater}
          disabled={watering}
          style={({ pressed }) => [styles.button, (watering || pressed) && { opacity: 0.7 }]}>
          <Text style={styles.buttonText}>{watering ? 'Watering…' : 'Water plant'}</Text>
        </Pressable>

        {message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.footer}>
          Last watered: {lastWatered ? lastWatered.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'not yet'}
        </Text>
        {profile.notes ? <Text style={styles.footer}>{profile.notes}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  content: { padding: 18, gap: 14, paddingBottom: 40 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hello: { fontSize: 24, fontWeight: '900', color: P.ink },
  sub: { color: P.mute, fontSize: 13 },
  editBtn: { backgroundColor: P.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  editText: { color: P.moss, fontWeight: '800' },

  stage: { alignItems: 'center', justifyContent: 'center', backgroundColor: P.white, borderRadius: 32, paddingTop: 26, paddingBottom: 18 },
  moodMsg: { marginTop: 8, fontWeight: '800', color: P.ink, fontSize: 16 },

  weekCard: { backgroundColor: P.white, borderRadius: 26, padding: 16, gap: 12 },
  weekTitle: { color: P.ink, fontSize: 16, fontWeight: '800' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekLabel: { color: P.muteLight, fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  weekLabelToday: { backgroundColor: P.moss, color: P.white },

  row: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, borderRadius: 26, padding: 16, gap: 6, minHeight: 150 },
  tileLabel: { color: '#E3EBDC', fontSize: 13, fontWeight: '700' },
  tileValue: { fontSize: 44, fontWeight: '900', color: P.white },
  tileFoot: { color: '#E3EBDC', fontWeight: '600', fontSize: 13 },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: P.white },

  camera: { height: 220, borderRadius: 26, backgroundColor: P.mist, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cameraText: { color: P.mute, textAlign: 'center', fontSize: 16 },
  liveBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: P.moss, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveText: { color: P.white, fontSize: 12, fontWeight: '800' },

  button: { backgroundColor: P.moss, borderRadius: 40, paddingVertical: 20, alignItems: 'center' },
  buttonText: { color: P.white, fontSize: 18, fontWeight: '800' },
  message: { textAlign: 'center', color: P.ink, fontWeight: '700' },
  error: { color: '#B3261E', textAlign: 'center' },
  footer: { textAlign: 'center', color: P.mute, fontSize: 13 },
});
