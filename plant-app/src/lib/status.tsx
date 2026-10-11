import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { getStatus, waterPlant, type Status } from './api';
import { POLL_MS } from './config';
import { WATERING_JUMP_PCT } from './mood';
import { notify } from './notify';
import { PUMP_COOLDOWN_MS, PUMP_ON_MS } from './pump';
import { useSettings } from './settings';

// Don't nag: at most one thirsty alert per this long.
const ALERT_EVERY_MS = 6 * 3600000;
// One watering shows up three ways (button press, pump running, moisture jump); log it once.
const MIN_GAP_BETWEEN_WATER_LOGS_MS = 30 * 60 * 1000;

type Ctx = {
  status: Status | null; // latest reading, null until the first one arrives
  error: string | null;
  retry: () => Promise<void>; // check the planter again right now
  water: () => Promise<void>; // throws with a readable message if the planter refuses
  cooldownUntil: number; // epoch ms when the pump can run again (0 = ready)
  splash: number; // goes up on every watering, to play the droplet animation
};
const StatusContext = createContext<Ctx | null>(null);

// Polls the planter for every page, logs thirsty days and waterings, and sends thirsty alerts.
export function StatusProvider({ children }: { children: ReactNode }) {
  const { loaded, profile, config, addEvent, logOncePerDay, addReading } = useSettings();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [splash, setSplash] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const failRef = useRef(0);
  const busyRef = useRef(false);
  const lastWaterLog = useRef(0);
  const wasPumping = useRef(false);
  const prevMoisture = useRef<number | null>(null);
  const lastAlert = useRef(0);

  const logWatering = useCallback(() => {
    lastWaterLog.current = Date.now();
    addEvent('water');
    setSplash((n) => n + 1);
  }, [addEvent]);

  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const s = await getStatus(config);
      setStatus(s);
      if (typeof s.cooldownMs === 'number') setCooldownUntil(s.cooldownMs > 0 ? Date.now() + s.cooldownMs : 0);

      // A watering the app didn't start: the pump turned on (e.g. from the planter's own page),
      // or the moisture jumped (watered by hand). Demo data jumps only when the app waters.
      const quiet = Date.now() - lastWaterLog.current > MIN_GAP_BETWEEN_WATER_LOGS_MS;
      const pumpStarted = s.pumpRunning && !wasPumping.current;
      const jumped = !config.useMock && prevMoisture.current != null && s.moisture - prevMoisture.current >= WATERING_JUMP_PCT;
      if (quiet && (pumpStarted || jumped)) logWatering();
      wasPumping.current = s.pumpRunning;
      prevMoisture.current = s.moisture;

      failRef.current = 0;
      setError(null);
    } catch {
      failRef.current += 1;
      if (failRef.current >= 3) setError("Can't reach the planter");
    } finally {
      busyRef.current = false;
    }
  }, [config, logWatering]);

  // Wait for the saved settings, so we don't poll the default IP (or skip demo mode) at startup.
  // Restarts whenever the config changes (e.g. a new IP), starting from a clean slate.
  const ready = loaded && profile.setupDone;
  useEffect(() => {
    if (!ready) return;
    prevMoisture.current = null;
    const first = setTimeout(refresh, 0);
    const id = setInterval(refresh, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [ready, refresh]);

  useEffect(() => {
    if (!ready || !status) return;
    addReading(status.moisture);
    const thirsty = status.moisture < config.dryBelow;
    // A thirsty moment gets recorded on the calendar (once per day).
    if (thirsty) logOncePerDay('dry');
    if (thirsty && profile.alerts && Date.now() - lastAlert.current > ALERT_EVERY_MS) {
      lastAlert.current = Date.now();
      notify(`${profile.name || 'Your plant'} is thirsty`, `Soil moisture is down to ${Math.round(status.moisture)}%.`);
    }
  }, [ready, status, config.dryBelow, profile.alerts, profile.name, addReading, logOncePerDay]);

  const water = useCallback(async () => {
    await waterPlant(config);
    logWatering();
    // Until the next poll reports the real cooldown, assume the firmware's default.
    setCooldownUntil(Date.now() + PUMP_ON_MS + (config.useMock ? 10000 : PUMP_COOLDOWN_MS));
    refresh();
  }, [config, logWatering, refresh]);

  const retry = useCallback(async () => {
    failRef.current = 2; // one more miss shows the offline card again straight away
    await refresh();
  }, [refresh]);

  return (
    <StatusContext.Provider value={{ status, error, retry, water, cooldownUntil, splash }}>{children}</StatusContext.Provider>
  );
}

export function useStatus() {
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error('useStatus must be used inside StatusProvider');
  return ctx;
}
