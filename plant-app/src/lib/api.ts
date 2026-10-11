import { REQUEST_TIMEOUT_MS, type PlanterConfig } from './config';

// Mirrors GET /status on the firmware (src/server.cpp).
export type Status = {
  moisture: number; // 0-100
  raw?: number; // raw ADC, for calibration
  temperature: number | null; // Celsius, null until the DHT has a good reading
  humidity: number | null; // percent, null until the DHT has a good reading
  pumpRunning: boolean;
  cooldownMs?: number; // 0 when a watering is allowed
  runsToday?: number;
  cameraReady?: boolean;
};

// ---- Mock state so the app works before the hardware does ----
let mockMoisture = 55;
let lastWateredMock = 0;

async function mockStatus(): Promise<Status> {
  mockMoisture = Math.max(5, Math.min(95, mockMoisture - 0.4 + (Math.random() - 0.5)));
  const pumpRunning = Date.now() - lastWateredMock < 1500;
  return { moisture: mockMoisture, temperature: 22 + Math.random(), humidity: 48 + Math.random() * 4, pumpRunning, cameraReady: false };
}

async function mockWater(): Promise<void> {
  if (Date.now() - lastWateredMock < 5000) throw new Error('Pump is cooling down');
  lastWateredMock = Date.now();
  await new Promise((r) => setTimeout(r, 1500));
  mockMoisture = Math.min(95, mockMoisture + 25);
}

// ---- Real calls ----
async function fetchJson(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? `Board replied ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

export async function getStatus(cfg: PlanterConfig): Promise<Status> {
  if (cfg.useMock) return mockStatus();
  const s = await fetchJson(`${cfg.boardUrl}/status`);
  return { ...s, temperature: s.temperature ?? null, humidity: s.humidity ?? null, pumpRunning: !!s.pumpRunning };
}

// POST /water -> { ok: true } or 429 { ok: false, error } while the pump is busy
export async function waterPlant(cfg: PlanterConfig): Promise<void> {
  if (cfg.useMock) return mockWater();
  const r = await fetchJson(`${cfg.boardUrl}/water`, { method: 'POST' });
  if (r && r.ok === false) throw new Error(r.error ?? 'Could not water');
}

// Used by the setup screen before a profile is saved.
export async function probeBoard(boardUrl: string): Promise<Status> {
  return fetchJson(`${boardUrl}/status`);
}
