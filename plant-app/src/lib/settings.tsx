import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { configFor, type PlanterConfig } from './config';
import { dayKey, seedHistory, type PlantEvent } from './dates';
import { DEFAULT_PROFILE, type Profile } from './profile';

// Everything we persist, under a single key.
const STORAGE_KEY = 'plant-app:v1';
type Saved = { profile: Profile; introSeen: boolean; events: PlantEvent[] };

type Ctx = {
  loaded: boolean; // false until saved data has been read from storage
  profile: Profile;
  config: PlanterConfig; // derived from profile; changes whenever the profile does
  save: (p: Profile) => void;
  editPlant: () => void;
  introSeen: boolean;
  setIntroSeen: (v: boolean) => void;
  events: PlantEvent[];
  addEvent: (kind: PlantEvent['kind']) => void; // always adds (e.g. a watering)
  logOncePerDay: (kind: PlantEvent['kind']) => void; // adds only if not logged today
};
const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [introSeen, setIntroSeen] = useState(false);
  const [events, setEvents] = useState<PlantEvent[]>([]);

  // Read saved state once at startup.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<Saved>;
        if (saved.profile) setProfile({ ...DEFAULT_PROFILE, ...saved.profile });
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

  const config = useMemo(() => configFor(profile), [profile]);

  const save = useCallback((p: Profile) => {
    setProfile({ ...p, setupDone: true });
    // Demo mode: fill the calendar with some fake history.
    if (p.useMock) setEvents((prev) => (prev.length ? prev : seedHistory()));
  }, []);
  const addEvent = useCallback((kind: PlantEvent['kind']) => setEvents((prev) => [...prev, { t: Date.now(), kind }]), []);
  const logOncePerDay = useCallback(
    (kind: PlantEvent['kind']) =>
      setEvents((prev) =>
        prev.some((e) => e.kind === kind && dayKey(new Date(e.t)) === dayKey(new Date())) ? prev : [...prev, { t: Date.now(), kind }],
      ),
    [],
  );
  const editPlant = useCallback(() => setProfile((p) => ({ ...p, setupDone: false })), []);

  const value = useMemo<Ctx>(
    () => ({ loaded, profile, config, save, editPlant, introSeen, setIntroSeen, events, addEvent, logOncePerDay }),
    [loaded, profile, config, save, editPlant, introSeen, events, addEvent, logOncePerDay],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
