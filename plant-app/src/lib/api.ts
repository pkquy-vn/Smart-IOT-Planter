import { CONFIG } from './config';

export type Status = {
  moisture: number; // 0-100
  temperature: number | null; // Celsius
  humidity: number | null; // % air humidity
  pumpRunning: boolean;
};

// ---- Mock state so the app works before the hardware does ----
let mockMoisture = 55;
let lastWateredMock = 0;

async function mockStatus(): Promise<Status> {
  mockMoisture = Math.max(5, Math.min(95, mockMoisture - 0.4 + (Math.random() - 0.5)));
  const pumpRunning = Date.now() - lastWateredMock < CONFIG.PUMP_ON_MS;
  return {
    moisture: mockMoisture,
    temperature: 22 + Math.random(),
    humidity: 48 + Math.round(Math.random() * 4),
    pumpRunning,
  };
}

async function mockWater(): Promise<void> {
  if (Date.now() - lastWateredMock < CONFIG.PUMP_ON_MS + CONFIG.PUMP_COOLDOWN_MS) {
    throw new Error('Pump is cooling down. Try again in a few seconds.');
  }
  await new Promise((r) => setTimeout(r, 300));
  lastWateredMock = Date.now();
  mockMoisture = Math.min(95, mockMoisture + 25);
}

// ---- Real calls (match the API contract with the hardware team) ----
async function fetchJson(path: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(CONFIG.SENSOR_BOARD_URL + path, { ...init, signal: ctrl.signal });
    // Error replies still carry a JSON body like { ok: false, error: "..." }, so read it first.
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? `Planter replied ${res.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

// GET /status -> { moisture, temperature, humidity, pumpRunning }
export async function getStatus(): Promise<Status> {
  if (CONFIG.USE_MOCK) return mockStatus();
  const d = await fetchJson('/status');
  return {
    moisture: Number(d.moisture) || 0,
    temperature: typeof d.temperature === 'number' ? d.temperature : null,
    humidity: typeof d.humidity === 'number' ? d.humidity : null,
    pumpRunning: !!d.pumpRunning,
  };
}

// POST /water -> { "ok": true }, or 400 { "ok": false, "error": "..." } while the pump is cooling down
export async function waterPlant(): Promise<void> {
  if (CONFIG.USE_MOCK) return mockWater();
  const r = await fetchJson('/water', { method: 'POST' });
  if (r && r.ok === false) throw new Error(r.error ?? 'Could not water');
}

