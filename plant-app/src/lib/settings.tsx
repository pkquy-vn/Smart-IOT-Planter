import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { CONFIG } from './config';
import { dayKey, seedHistory, type PlantEvent } from './dates';

export type Profile = {
  setupDone: boolean;
  name: string;
  species: string;
  thirstyBelow: string; // percent, as typed
  location: string;
  notes: string;
  useMock: boolean;
  sensorIp: string; // e.g. 192.168.1.50
  cameraIp: string; // e.g. 192.168.1.51
};

const DEFAULT: Profile = {
  setupDone: false,
  name: '',
  species: '',
  thirstyBelow: '30',
  location: '',
  notes: '',
  useMock: true,
  sensorIp: '',
  cameraIp: '',
};

// Everything we persist, under a single key.
const STORAGE_KEY = 'plant-app:v1';
type Saved = { profile: Profile; introSeen: boolean; events: PlantEvent[] };

type Ctx = {
  loaded: boolean; // false until saved data has been read from storage
  profile: Profile;
  save: (p: Profile) => void;
  editPlant: () => void;
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
  events: PlantEvent[];
  addEvent: (kind: PlantEvent['kind']) => void; // always adds (e.g. a watering)
  logOncePerDay: (kind: PlantEvent['kind']) => void; // adds only if not logged today
};
const SettingsContext = createContext<Ctx | null>(null);

const withHttp = (ip: string) => (ip.startsWith('http') ? ip : `http://${ip}`).replace(/\/$/, '');

// Push the profile into CONFIG so api.ts and the dashboard use it.
function applyToConfig(p: Profile) {
  CONFIG.USE_MOCK = p.useMock;
  if (p.sensorIp.trim()) CONFIG.SENSOR_BOARD_URL = withHttp(p.sensorIp.trim());
  // One ESP32 does everything, so the camera defaults to the planter's IP.
  const cam = p.cameraIp.trim() || p.sensorIp.trim();
  if (cam) CONFIG.CAMERA_SNAPSHOT_URL = `${withHttp(cam)}/capture`;
  const dry = parseInt(p.thirstyBelow, 10);
  CONFIG.DRY_BELOW = Number.isFinite(dry) ? Math.min(Math.max(dry, 0), 90) : 30;
  CONFIG.WET_ABOVE = Math.max(70, CONFIG.DRY_BELOW + 20);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  const [introSeen, setIntroSeen] = useState(false);
  const [events, setEvents] = useState<PlantEvent[]>([]);

  // Read saved state once at startup.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Saved>;
        if (saved.profile) {
          const p = { ...DEFAULT, ...saved.profile };
          applyToConfig(p);
          setProfile(p);
        }
        if (saved.introSeen) setIntroSeen(true);
        if (Array.isArray(saved.events)) setEvents(saved.events);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Write whenever anything changes. Skipped until the first read finishes,
  // so defaults never overwrite real saved data.
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, introSeen, events })).catch(() => {});
  }, [loaded, profile, introSeen, events]);

  const save = (p: Profile) => {
    applyToConfig(p);
    setProfile({ ...p, setupDone: true });
    // Demo mode: fill the calendar with some fake history.
    if (p.useMock) setEvents((prev) => (prev.length ? prev : seedHistory()));
  };
  const addEvent = (kind: PlantEvent['kind']) => setEvents((prev) => [...prev, { t: Date.now(), kind }]);
  const logOncePerDay = (kind: PlantEvent['kind']) =>
    setEvents((prev) =>
      prev.some((e) => e.kind === kind && dayKey(new Date(e.t)) === dayKey(new Date()))
        ? prev
        : [...prev, { t: Date.now(), kind }],
    );
  const editPlant = () => setProfile((p) => ({ ...p, setupDone: false }));

  return (
    <SettingsContext.Provider value={{ loaded, profile, save, editPlant, introSeen, setIntroSeen, events, addEvent, logOncePerDay }}>
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
