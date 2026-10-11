import type { Profile } from './profile';

// The ESP32 runs its own access point and always answers at this address.
export const DEFAULT_PLANTER_IP = '192.168.4.1';

// Fixed tuning knobs. Anything the user can change lives in the Profile and is
// turned into a PlanterConfig by configFor() below.
export const POLL_MS = 2000;
export const CAMERA_REFRESH_MS = 1500;
export const REQUEST_TIMEOUT_MS = 5000;
export const DEFAULT_DRY_BELOW = 30;
export const MIN_WET_ABOVE = 70;

export type PlanterConfig = {
  useMock: boolean;
  boardUrl: string; // http://host, no trailing slash
  cameraSnapshotUrl: string; // full URL of the JPEG endpoint
  dryBelow: number; // percent
  wetAbove: number; // percent
  fahrenheit: boolean;
};

export const withHttp = (host: string) => (host.startsWith('http') ? host : `http://${host}`).replace(/\/$/, '');

// Pure: the same profile always gives the same config, so components can derive
// it with useMemo and re-render when the profile changes.
export function configFor(p: Profile): PlanterConfig {
  const sensorHost = p.sensorIp.trim() || DEFAULT_PLANTER_IP;
  const cameraHost = p.cameraIp.trim() || sensorHost;
  const dry = parseInt(p.thirstyBelow, 10);
  const dryBelow = Number.isFinite(dry) ? Math.min(Math.max(dry, 0), 90) : DEFAULT_DRY_BELOW;
  return {
    useMock: p.useMock,
    boardUrl: withHttp(sensorHost),
    cameraSnapshotUrl: `${withHttp(cameraHost)}/capture`,
    dryBelow,
    wetAbove: Math.max(MIN_WET_ABOVE, dryBelow + 20),
    fahrenheit: p.fahrenheit,
  };
}
