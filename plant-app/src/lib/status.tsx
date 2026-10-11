import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { getStatus, waterPlant, type Status } from './api';
import { CONFIG } from './config';
import { notify } from './notify';
import { useSettings } from './settings';

// Don't nag: at most one thirsty alert per this long.
const ALERT_EVERY_MS = 6 * 3600000;

type Ctx = {
  status: Status | null; // latest reading, null until the first one arrives
  error: string | null;
  water: () => Promise<void>; // throws with a readable message if the planter refuses
  splash: number; // goes up on every watering, to play the droplet animation
};
const StatusContext = createContext<Ctx | null>(null);

// Polls the planter for every page, logs thirsty days and waterings, and sends thirsty alerts.
export function StatusProvider({ children }: { children: ReactNode }) {
  const { loaded, profile, addEvent, logOncePerDay, addReading } = useSettings();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splash, setSplash] = useState(0);
  const failRef = useRef(0);
  const busyRef = useRef(false);
  const pressedAt = useRef(0);
  const wasPumping = useRef(false);
  const lastAlert = useRef(0);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const s = await getStatus();
      setStatus(s);
      // The pump started without the app's button (e.g. from the planter's own web page): log it too.
      const ourPress = Date.now() - pressedAt.current < CONFIG.PUMP_ON_MS + 3000;
      if (s.pumpRunning && !wasPumping.current && !ourPress) {
        addEvent('water');
        setSplash((n) => n + 1);
      }
      wasPumping.current = s.pumpRunning;
      failRef.current = 0;
      setError(null);
    } catch {
      failRef.current += 1;
      if (failRef.current >= 3) setError("Can't reach the planter. Same Wi-Fi? Check the IP in Settings.");
    } finally {
      busyRef.current = false;
    }
  }, [addEvent]);

  // Wait for the saved settings, so we don't poll the default IP (or skip demo mode) at startup.
  const ready = loaded && profile.setupDone;
  useEffect(() => {
    if (!ready) return;
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, CONFIG.POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready || !status) return;
    addReading(status.moisture);
    const thirsty = status.moisture < CONFIG.DRY_BELOW;
    // A thirsty moment gets recorded on the calendar (once per day).
    if (thirsty) logOncePerDay('dry');
    if (thirsty && profile.alerts && Date.now() - lastAlert.current > ALERT_EVERY_MS) {
      lastAlert.current = Date.now();
      notify(`${profile.name || 'Your plant'} is thirsty`, `Soil moisture is down to ${Math.round(status.moisture)}%.`);
    }
  }, [ready, status, profile.alerts, profile.name, addReading, logOncePerDay]);

  const water = useCallback(async () => {
    pressedAt.current = Date.now();
    await waterPlant();
    addEvent('water');
    setSplash((n) => n + 1);
    refresh();
  }, [addEvent, refresh]);

  return <StatusContext.Provider value={{ status, error, water, splash }}>{children}</StatusContext.Provider>;
}

export function useStatus() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error('useStatus must be used inside StatusProvider');
  return ctx;
}
