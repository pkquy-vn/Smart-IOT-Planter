import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { configFor, HISTORY_DAYS, HISTORY_SAMPLE_MS, type PlanterConfig } from './config';
import { dayKey, seedHistory, seedReadings, type PlantEvent, type Reading } from './dates';
import { PLANT_TYPES } from './plants';
import { DEFAULT_PROFILE, type Profile } from './profile';

// Everything we persist, under a single key. Readings are big and change often, so they get their own.
const STORAGE_KEY = 'plant-app:v1';
const READINGS_KEY = 'plant-app:readings';
type Saved = { profile: Profile; introSeen: boolean; tourSeen: boolean; events: PlantEvent[] };

type Ctx = {
  loaded: boolean; // false until saved data has been read from storage
  profile: Profile;
  config: PlanterConfig; // derived from profile; changes whenever the profile does
  save: (p: Profile) => void; // also finishes onboarding
  resetApp: () => void; // forget everything and show the intro again
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
  tourSeen: boolean; // the first-run tips on Home
  setTourSeen: (v: boolean) => void;
  events: PlantEvent[];
  addEvent: (kind: PlantEvent['kind']) => void; // always adds (e.g. a watering)
  logOncePerDay: (kind: PlantEvent['kind']) => void; // adds only if not logged today
  readings: Reading[];
  addReading: (moisture: number) => void; // keeps at most one per HISTORY_SAMPLE_MS
};
const SettingsContext = createContext<Ctx | null>(null);

const pruneReadings = (rs: Reading[]) => {
  const cutoff = Date.now() - HISTORY_DAYS * 86400000;
  return rs.filter((r) => r.t >= cutoff);
};

// Profiles saved by older versions of the app: fill in new fields and convert old ones.
function migrate(saved: Partial<Profile> & { fahrenheit?: boolean }): Profile {
  const p = { ...DEFAULT_PROFILE, ...saved };
  if (!(p.plantType in PLANT_TYPES)) p.plantType = DEFAULT_PROFILE.plantType;
  // Older versions saved a Fahrenheit switch instead of units.
  if (!saved.units && typeof saved.fahrenheit === 'boolean') p.units = saved.fahrenheit ? 'imperial' : 'metric';
  // Older versions always stored a thirsty level; if it's just the default, follow the plant type instead.
  if (parseInt(p.thirstyBelow, 10) === PLANT_TYPES[p.plantType].dryBelow) p.thirstyBelow = '';
  return p;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [introSeen, setIntroSeen] = useState(false);
  const [tourSeen, setTourSeen] = useState(false);
  const [events, setEvents] = useState<PlantEvent[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);

  // Read saved state once at startup.
  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(READINGS_KEY)])
      .then(([raw, rawReadings]) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<Saved>;
          const savedEvents = Array.isArray(saved.events) ? saved.events : [];
          if (saved.profile) {
            const p = migrate(saved.profile);
            // Older saves have no setup date: use the earliest journal entry instead.
            if (p.setupDone && !p.since) p.since = savedEvents.reduce((min, e) => Math.min(min, e.t), Date.now());
            setProfile(p);
          }
          if (saved.introSeen) setIntroSeen(true);
          if (saved.tourSeen) setTourSeen(true);
          setEvents(savedEvents);
        }
        if (rawReadings) {
          const rs = JSON.parse(rawReadings);
          if (Array.isArray(rs)) setReadings(pruneReadings(rs));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Write whenever anything changes. Skipped until the first read finishes,
  // so defaults never overwrite real saved data.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, introSeen, tourSeen, events })).catch(() => {});
  }, [loaded, profile, introSeen, tourSeen, events]);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(READINGS_KEY, JSON.stringify(readings)).catch(() => {});
  }, [loaded, readings]);

  const config = useMemo(() => configFor(profile), [profile]);

  const save = useCallback(
    (p: Profile) => {
      // Demo mode comes with 45 days of fake history, so it starts "together" from the first fake entry.
      const history = p.useMock && !events.length ? seedHistory() : events;
      const since = p.since ?? history.reduce((min, e) => Math.min(min, e.t), Date.now());
      setProfile({ ...p, since, setupDone: true });
      // Demo mode: fill the calendar and the chart with some fake history.
      if (p.useMock) {
        if (!events.length) setEvents(history);
        setReadings((prev) => (prev.length ? prev : seedReadings(history, HISTORY_SAMPLE_MS, HISTORY_DAYS)));
      }
    },
    [events],
  );
  const addEvent = useCallback((kind: PlantEvent['kind']) => setEvents((prev) => [...prev, { t: Date.now(), kind }]), []);
  const logOncePerDay = useCallback(
    (kind: PlantEvent['kind']) =>
      setEvents((prev) =>
        prev.some((e) => e.kind === kind && dayKey(new Date(e.t)) === dayKey(new Date())) ? prev : [...prev, { t: Date.now(), kind }],
      ),
    [],
  );
  const addReading = useCallback(
    (m: number) =>
      setReadings((prev) => {
        const last = prev[prev.length - 1];
        if (last && Date.now() - last.t < HISTORY_SAMPLE_MS) return prev;
        return pruneReadings([...prev, { t: Date.now(), m: Math.round(m) }]);
      }),
    [],
  );
  const resetApp = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    setIntroSeen(false);
    setTourSeen(false);
    setEvents([]);
    setReadings([]);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      loaded, profile, config, save, resetApp, introSeen, setIntroSeen, tourSeen, setTourSeen,
      events, addEvent, logOncePerDay, readings, addReading,
    }),
    [loaded, profile, config, save, resetApp, introSeen, tourSeen, events, addEvent, logOncePerDay, readings, addReading],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
