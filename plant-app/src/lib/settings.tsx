import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { CONFIG } from './config';
import { dayKey, seedHistory, seedReadings, type PlantEvent, type Reading } from './dates';
import { PLANT_TYPES, type PlantTypeId, type Units } from './plants';

export type Profile = {
  setupDone: boolean;
  name: string;
  species: string;
  plantType: PlantTypeId;
  thirstyBelow: string; // percent as typed in Settings; empty = use the plant type's default
  useMock: boolean;
  sensorIp: string; // e.g. 192.168.1.50
  cameraIp: string; // e.g. 192.168.1.51
  alerts: boolean; // notify when the plant gets thirsty
  since: number | null; // when the plant was first set up (for "days together")
  units: Units; // imperial = °F, fl oz, inches; metric = °C, ml, centimeters
};

const DEFAULT: Profile = {
  setupDone: false,
  name: '',
  species: '',
  plantType: 'leafy',
  thirstyBelow: '',
  useMock: true,
  sensorIp: '',
  cameraIp: '',
  alerts: true,
  since: null,
  units: 'imperial',
};

// Everything we persist, under a single key. Readings are big and change often, so they get their own.
const STORAGE_KEY = 'plant-app:v1';
const READINGS_KEY = 'plant-app:readings';
type Saved = { profile: Profile; introSeen: boolean; tourSeen: boolean; events: PlantEvent[] };

type Ctx = {
  loaded: boolean; // false until saved data has been read from storage
  profile: Profile;
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
  addReading: (moisture: number) => void; // keeps at most one per CONFIG.HISTORY_SAMPLE_MS
};
const SettingsContext = createContext<Ctx | null>(null);

const withHttp = (ip: string) => (ip.startsWith('http') ? ip : `http://${ip}`).replace(/\/$/, '');

// The thirsty level in use: the user's own number from Settings, or the plant type's default.
export const dryBelowOf = (p: Profile) => {
  const n = parseInt(p.thirstyBelow, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), 90) : PLANT_TYPES[p.plantType].dryBelow;
};

// Push the profile into CONFIG so api.ts and the dashboard use it.
function applyToConfig(p: Profile) {
  CONFIG.USE_MOCK = p.useMock;
  if (p.sensorIp.trim()) CONFIG.SENSOR_BOARD_URL = withHttp(p.sensorIp.trim());
  // One ESP32 does everything, so the camera defaults to the planter's IP.
  const cam = p.cameraIp.trim() || p.sensorIp.trim();
  if (cam) CONFIG.CAMERA_SNAPSHOT_URL = `${withHttp(cam)}/capture`;
  CONFIG.DRY_BELOW = dryBelowOf(p);
  CONFIG.WET_ABOVE = Math.min(98, Math.max(PLANT_TYPES[p.plantType].wetAbove, CONFIG.DRY_BELOW + 15));
  CONFIG.TOO_WET = Math.min(99, CONFIG.WET_ABOVE + 15);
  CONFIG.FAHRENHEIT = p.units === 'imperial';
}

const pruneReadings = (rs: Reading[]) => {
  const cutoff = Date.now() - CONFIG.HISTORY_DAYS * 86400000;
  return rs.filter((r) => r.t >= cutoff);
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT);
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
          if (saved.profile) {
            // Spread over DEFAULT so profiles saved by older versions get the new fields.
            const p = { ...DEFAULT, ...saved.profile };
            if (!(p.plantType in PLANT_TYPES)) p.plantType = DEFAULT.plantType;
            // Older versions saved a Fahrenheit switch instead of units.
            const old = saved.profile as Partial<Profile> & { fahrenheit?: boolean };
            if (!old.units && typeof old.fahrenheit === 'boolean') p.units = old.fahrenheit ? 'imperial' : 'metric';
            // Older versions always stored a thirsty level; if it's just the default, follow the plant type instead.
            if (parseInt(p.thirstyBelow, 10) === PLANT_TYPES[p.plantType].dryBelow) p.thirstyBelow = '';
            applyToConfig(p);
            setProfile(p);
          }
          if (saved.introSeen) setIntroSeen(true);
          if (saved.tourSeen) setTourSeen(true);
          if (Array.isArray(saved.events)) setEvents(saved.events);
          // Older saves have no setup date: use the earliest journal entry instead.
          if (saved.profile?.setupDone && !saved.profile.since) {
            const first = (saved.events ?? []).reduce((min, e) => Math.min(min, e.t), Date.now());
            setProfile((p) => ({ ...p, since: first }));
          }
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

  const save = (p: Profile) => {
    applyToConfig(p);
    // Demo mode comes with 45 days of fake history, so it starts "together" from the first fake entry.
    const history = p.useMock && !events.length ? seedHistory() : events;
    const since = p.since ?? history.reduce((min, e) => Math.min(min, e.t), Date.now());
    setProfile({ ...p, since, setupDone: true });
    // Demo mode: fill the calendar and the chart with some fake history.
    if (p.useMock) {
      if (!events.length) setEvents(history);
      setReadings((prev) => (prev.length ? prev : seedReadings(history, CONFIG.HISTORY_SAMPLE_MS, CONFIG.HISTORY_DAYS)));
    }
  };
  const addEvent = useCallback(
    (kind: PlantEvent['kind']) => setEvents((prev) => [...prev, { t: Date.now(), kind }]),
    [],
  );
  const logOncePerDay = useCallback(
    (kind: PlantEvent['kind']) =>
      setEvents((prev) =>
        prev.some((e) => e.kind === kind && dayKey(new Date(e.t)) === dayKey(new Date()))
          ? prev
          : [...prev, { t: Date.now(), kind }],
      ),
    [],
  );
  const addReading = useCallback(
    (m: number) =>
      setReadings((prev) => {
        const last = prev[prev.length - 1];
        if (last && Date.now() - last.t < CONFIG.HISTORY_SAMPLE_MS) return prev;
        return pruneReadings([...prev, { t: Date.now(), m: Math.round(m) }]);
      }),
    [],
  );
  const resetApp = () => {
    applyToConfig(DEFAULT);
    setProfile(DEFAULT);
    setIntroSeen(false);
    setTourSeen(false);
    setEvents([]);
    setReadings([]);
  };

  return (
    <SettingsContext.Provider
      value={{ loaded, profile, save, resetApp, introSeen, setIntroSeen, tourSeen, setTourSeen, events, addEvent, logOncePerDay, readings, addReading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export { withHttp };
