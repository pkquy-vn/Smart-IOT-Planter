import { REQUEST_TIMEOUT_MS, type PlanterConfig } from './config';
import { PUMP_ON_MS } from './pump';

// Mirrors GET /status on the firmware (src/server.cpp).
export type Status = {
  moisture: number; // 0-100
  raw?: number; // raw ADC, for calibration
  temperature: number | null; // Celsius, null until the probe has a good reading
  pumpRunning: boolean;
  cooldownMs?: number; // 0 when a watering is allowed
  runsToday?: number;
  cameraReady?: boolean;
};

// ---- Mock state so the app works before the hardware does ----
// Demo mode uses a short cooldown so trying the Water button isn't a 2-minute wait.
const MOCK_COOLDOWN_MS = 10000;
let mockMoisture = 55;
let lastWateredMock = 0;

const mockCooldownLeft = () => Math.max(0, lastWateredMock + PUMP_ON_MS + MOCK_COOLDOWN_MS - Date.now());

async function mockStatus(): Promise<Status> {
  mockMoisture = Math.max(5, Math.min(95, mockMoisture - 0.4 + (Math.random() - 0.5)));
  return {
    moisture: mockMoisture,
    temperature: 22 + Math.random(),
    pumpRunning: Date.now() - lastWateredMock < PUMP_ON_MS,
    cooldownMs: mockCooldownLeft(),
    cameraReady: false,
  };
}

async function mockWater(): Promise<void> {
  if (mockCooldownLeft() > 0) throw new Error('Pump is cooling down. Try again in a few seconds.');
  await new Promise((r) => setTimeout(r, 300));
  lastWateredMock = Date.now();
  mockMoisture = Math.min(95, mockMoisture + 25);
}

// ---- Real calls ----
async function fetchJson(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    // Error replies still carry a JSON body like { ok: false, error: "..." }, so read it first.
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? `Planter replied ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function getStatus(cfg: PlanterConfig): Promise<Status> {
  if (cfg.useMock) return mockStatus();
  const s = await fetchJson(`${cfg.boardUrl}/status`);
  return {
    ...s,
    moisture: Number(s.moisture) || 0,
    temperature: typeof s.temperature === 'number' ? s.temperature : null,
    pumpRunning: !!s.pumpRunning,
  };
}

// POST /water -> { ok: true } or 429 { ok: false, error, cooldownMs } while the pump is busy
export async function waterPlant(cfg: PlanterConfig): Promise<void> {
  if (cfg.useMock) return mockWater();
  const r = await fetchJson(`${cfg.boardUrl}/water`, { method: 'POST' });
  if (r && r.ok === false) throw new Error(r.error ?? 'Could not water');
}

// Used by the setup screen before a profile is saved.
export async function probeBoard(boardUrl: string): Promise<Status> {
  return fetchJson(`${boardUrl}/status`);
}
