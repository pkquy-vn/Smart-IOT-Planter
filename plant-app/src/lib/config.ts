import { PLANT_TYPES, type Units } from './plants';
import type { Profile } from './profile';

// The ESP32 runs its own access point and always answers at this address.
export const DEFAULT_PLANTER_IP = '192.168.4.1';

// Fixed tuning knobs. Anything the user can change lives in the Profile and is
// turned into a PlanterConfig by configFor() below. Pump numbers live in pump.ts.
export const POLL_MS = 2000;
export const CAMERA_REFRESH_MS = 1500;
export const REQUEST_TIMEOUT_MS = 5000;

// Moisture history for the chart: one reading every 10 min, kept for 7 days
export const HISTORY_SAMPLE_MS = 10 * 60 * 1000;
export const HISTORY_DAYS = 7;

// How far above "soaked" counts as too much water.
export const TOO_WET_GAP = 15;

export type PlanterConfig = {
  useMock: boolean;
  boardUrl: string; // http://host, no trailing slash
  cameraSnapshotUrl: string; // full URL of the JPEG endpoint
  dryBelow: number; // percent: thirsty below this
  wetAbove: number; // percent: nicely soaked above this
  tooWet: number; // percent: too much water above this
  units: Units;
  fahrenheit: boolean;
};

export const withHttp = (host: string) => (host.startsWith('http') ? host : `http://${host}`).replace(/\/$/, '');

// Pure: the same profile always gives the same config, so components can derive
// it with useMemo and re-render when the profile changes.
export function configFor(p: Profile): PlanterConfig {
  const type = PLANT_TYPES[p.plantType] ?? PLANT_TYPES.leafy;
  const sensorHost = p.sensorIp.trim() || DEFAULT_PLANTER_IP;
  const cameraHost = p.cameraIp.trim() || sensorHost;
  // The thirsty level comes from the plant type unless the user set their own in Settings.
  const dry = parseInt(p.thirstyBelow, 10);
  const dryBelow = Number.isFinite(dry) ? Math.min(Math.max(dry, 0), 90) : type.dryBelow;
  const wetAbove = Math.max(type.wetAbove, dryBelow + 15);
  return {
    useMock: p.useMock,
    boardUrl: withHttp(sensorHost),
    cameraSnapshotUrl: `${withHttp(cameraHost)}/capture`,
    dryBelow,
    wetAbove,
    tooWet: wetAbove + TOO_WET_GAP,
    units: p.units,
    fahrenheit: p.units === 'imperial',
  };
}
