import { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoistureRing } from '@/components/moisture-ring';
import { OfflineCard } from '@/components/offline-card';
import { Skeleton } from '@/components/skeleton';
import { SplashBurst } from '@/components/splash-burst';
import { Sprout } from '@/components/sprout';
import { Text } from '@/components/text';
import { WaterButton } from '@/components/water-button';
import { WeekCard } from '@/components/week-card';
import { useNow } from '@/hooks/use-now';
import { P } from '@/lib/palette';
import { PLANT_TYPES } from '@/lib/plants';
import { milestones } from '@/lib/milestones';
import { moistureLabel, moodMessage, sproutMoodFor } from '@/lib/mood';
import { useSettings } from '@/lib/settings';
import { useStatus } from '@/lib/status';
import { useTourScroller, useTourTarget } from '@/lib/tour';

// Home: how the plant is doing right now, this week at a glance, and the Water button.
export default function Home() {
  const { profile, config, events } = useSettings();
  const { status, error, retry, water, cooldownUntil, splash } = useStatus();
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
    config.dryBelow,
    config.wetAbove,
    PLANT_TYPES[profile.plantType].everyDays * 24,
    config.tooWet,
  );
  const temp =
    status?.temperature != null
      ? config.fahrenheit
        ? `${Math.round((status.temperature * 9) / 5 + 32)}°`
        : `${status.temperature.toFixed(1)}°`
      : null;
  const lastWateredLabel = lastWatered
    ? lastWatered.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })
    : 'not yet';
  const sub = profile.species || PLANT_TYPES[profile.plantType].label;
  const loading = !status && !error;
  const streak = milestones(events, profile.since ?? now, now).happyStreak;

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
          {streak >= 2 && !error && <Text style={styles.streak}>{streak} happy days in a row</Text>}
          <Text style={styles.moodMsg}>{error ? 'Zzz… I can’t find the planter' : status?.pumpRunning ? 'Glug glug glug…' : moodMessage[mood]}</Text>
        </View>

        <View {...tourWeek}>
          <WeekCard />
        </View>

        {error && <OfflineCard onRetry={retry} hasOldReadings={!!status} boardUrl={config.boardUrl} />}

        <View style={styles.row}>
          <View style={[styles.tile, styles.moistTile]}>
            <Text style={styles.tileLabel}>Soil moisture</Text>
            <View style={{ alignItems: 'center', paddingVertical: 4 }}>
              <MoistureRing value={moisture} dryBelow={config.dryBelow} size={112} />
            </View>
            {loading ? (
              <Skeleton width="60%" height={14} style={{ alignSelf: 'center' }} />
            ) : (
              <Text style={styles.tileFoot}>{moisture != null ? moistureLabel(moisture, config.dryBelow, config.wetAbove, config.tooWet) : 'No reading'}</Text>
            )}
          </View>

          <View style={styles.col}>
            <View style={[styles.tile, styles.smallTile]}>
              <Text style={styles.smallLabel}>Temperature</Text>
              {loading ? <Skeleton width={70} height={30} color={P.mist} /> : <Text style={styles.smallValue}>{temp ?? '--'}</Text>}
              <Text style={styles.smallFoot}>{config.fahrenheit ? 'Fahrenheit' : 'Celsius'}</Text>
            </View>
            <View style={[styles.tile, styles.smallTile]}>
              <Text style={styles.smallLabel}>Last watered</Text>
              <Text style={styles.smallValue} numberOfLines={1} adjustsFontSizeToFit>{lastWateredLabel}</Text>
              <Text style={styles.smallFoot}>{lastWatered ? 'From the journal' : 'Press the button below'}</Text>
            </View>
          </View>
        </View>

        <View {...tourWater}>
          <WaterButton
            onWater={water}
            pumpRunning={!!status?.pumpRunning}
            cooldownUntil={cooldownUntil}
            soaked={moisture != null && moisture > config.wetAbove}
          />
        </View>

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
  streak: {
    marginTop: 4, backgroundColor: P.mist, color: P.fern, fontSize: 12, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, overflow: 'hidden',
  },
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

});
