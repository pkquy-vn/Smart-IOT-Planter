import { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoistureRing } from '@/components/moisture-ring';
import { Skeleton } from '@/components/skeleton';
import { SplashBurst } from '@/components/splash-burst';
import { Sprout, sproutMoodFor } from '@/components/sprout';
import { Text } from '@/components/text';
import { WaterButton } from '@/components/water-button';
import { WeekCard } from '@/components/week-card';
import { useNow } from '@/hooks/use-now';
import { CONFIG } from '@/lib/config';
import { P } from '@/lib/palette';
import { PLANT_TYPES } from '@/lib/plants';
import { useSettings } from '@/lib/settings';
import { useStatus } from '@/lib/status';
import { useTourScroller, useTourTarget } from '@/lib/tour';

function moistureLabel(m: number) {
  if (m < CONFIG.DRY_BELOW) return 'Thirsty';
  if (m > CONFIG.TOO_WET) return 'Too wet';
  if (m > CONFIG.WET_ABOVE) return 'Soaked';
  return 'Happy';
}

const MOOD_MSG = {
  joy: 'Ahh, so refreshing!',
  sad: 'Please water me…',
  thirsty: 'I need a drink!',
  wet: 'Whoa, that’s a lot of water!',
  happy: 'Feeling great!',
  ok: 'Just hanging out',
};

// Home: how the plant is doing right now, this week at a glance, and the Water button.
export default function Home() {
  const { profile, events } = useSettings();
  const { status, error, water, splash } = useStatus();
  const now = useNow();
  const scrollRef = useRef<ScrollView>(null);
  useTourScroller(useCallback((y: number) => scrollRef.current?.scrollTo({ y, animated: true }), []));
  const tourSprout = useTourTarget('sprout');
  const tourWeek = useTourTarget('week');
  const tourWater = useTourTarget('water');

  const lastWatered = useMemo(() => {
    const w = events.filter((e) => e.kind === 'water');
    return w.length ? new Date(Math.max(...w.map((e) => e.t))) : null;
  }, [events]);

  if (!profile.setupDone) return <View style={styles.safe} />;

  const moisture = status?.moisture ?? null;
  const hoursSinceWater = lastWatered ? (now - lastWatered.getTime()) / 3600000 : null;
  const mood = sproutMoodFor(
    moisture,
    hoursSinceWater,
    CONFIG.DRY_BELOW,
    CONFIG.WET_ABOVE,
    PLANT_TYPES[profile.plantType].everyDays * 24,
    CONFIG.TOO_WET,
  );
  const temp =
    status?.temperature != null
      ? CONFIG.FAHRENHEIT
        ? `${Math.round((status.temperature * 9) / 5 + 32)}°`
        : `${status.temperature.toFixed(1)}°`
      : null;
  const humidity = status?.humidity != null ? `${Math.round(status.humidity)}%` : null;
  const sub = profile.species || PLANT_TYPES[profile.plantType].label;
  const loading = !status && !error;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.hello}>hello, {profile.name} !</Text>
          <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
        </View>

        <View {...tourSprout} style={styles.stage}>
          <Sprout size={200} mood={mood} />
          <SplashBurst trigger={splash} />
          <Text style={styles.moodMsg}>{status?.pumpRunning ? 'Glug glug glug…' : MOOD_MSG[mood]}</Text>
        </View>

        <View {...tourWeek}>
          <WeekCard />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.row}>
          <View style={[styles.tile, styles.moistTile]}>
            <Text style={styles.tileLabel}>Soil moisture</Text>
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <MoistureRing value={moisture} dryBelow={CONFIG.DRY_BELOW} size={112} />
            </View>
            {loading ? (
              <Skeleton width="60%" height={14} style={{ alignSelf: 'center' }} />
            ) : (
              <Text style={styles.tileFoot}>{moisture != null ? moistureLabel(moisture) : 'No reading'}</Text>
            )}
          </View>

          <View style={styles.col}>
            <View style={[styles.tile, styles.smallTile]}>
              <Text style={styles.smallLabel}>Temperature</Text>
              {loading ? <Skeleton width={70} height={30} color={P.mist} /> : <Text style={styles.smallValue}>{temp ?? '--'}</Text>}
              <Text style={styles.smallFoot}>{CONFIG.FAHRENHEIT ? 'Fahrenheit' : 'Celsius'}</Text>
            </View>
            <View style={[styles.tile, styles.smallTile]}>
              <Text style={styles.smallLabel}>Air humidity</Text>
              {loading ? <Skeleton width={70} height={30} color={P.mist} /> : <Text style={styles.smallValue}>{humidity ?? '--'}</Text>}
              <Text style={styles.smallFoot}>Around the plant</Text>
            </View>
          </View>
        </View>

        <View {...tourWater}>
          <WaterButton onWater={water} pumpRunning={!!status?.pumpRunning} />
        </View>

        <Text style={styles.footer}>
          Last watered:{' '}
          {lastWatered ? lastWatered.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'not yet'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.paper },
  content: { padding: 18, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 720, alignSelf: 'center' },
  hello: { fontSize: 24, fontWeight: '900', color: P.ink },
  sub: { color: P.mute, fontSize: 13 },

  stage: { alignItems: 'center', justifyContent: 'center', backgroundColor: P.white, borderRadius: 26, paddingTop: 26, paddingBottom: 18, overflow: 'hidden' },
  moodMsg: { marginTop: 8, fontWeight: '800', color: P.ink, fontSize: 16 },

  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 12 },
  tile: { borderRadius: 26, padding: 16, gap: 6 },
  moistTile: { flex: 1, backgroundColor: P.moss },
  smallTile: { flex: 1, backgroundColor: P.white, justifyContent: 'space-between' },
  tileLabel: { color: '#E3EBDC', fontSize: 13, fontWeight: '700' },
  tileFoot: { color: P.white, fontWeight: '800', fontSize: 14, textAlign: 'center' },
  smallLabel: { color: P.mute, fontSize: 13, fontWeight: '700' },
  smallValue: { fontSize: 30, fontWeight: '900', color: P.ink },
  smallFoot: { color: P.mute, fontWeight: '600', fontSize: 12 },

  error: { color: P.alert, backgroundColor: P.white, textAlign: 'center', fontWeight: '600', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16 },
  footer: { textAlign: 'center', color: P.mute, fontSize: 13 },
});
