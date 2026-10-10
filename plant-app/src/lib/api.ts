import { CONFIG } from './config';

export type Status = { moisture: number; temperature: number | null }; // moisture 0-100, temperature in C

// ---- Mock state so the app works before the hardware does ----
let mockMoisture = 55;
let lastWateredMock = 0;

async function mockStatus(): Promise<Status> {
  mockMoisture = Math.max(5, Math.min(95, mockMoisture - 0.4 + (Math.random() - 0.5)));
  return { moisture: mockMoisture, temperature: 22 + Math.random() };
}

async function mockWater(): Promise<void> {
  if (Date.now() - lastWateredMock < 5000) throw new Error('Pump cooling down');
  lastWateredMock = Date.now();
  await new Promise((r) => setTimeout(r, 1500));
  mockMoisture = Math.min(95, mockMoisture + 25);
}

// ---- Real calls (match the API contract with the hardware team) ----
async function fetchJson(path: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(CONFIG.SENSOR_BOARD_URL + path, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`Board replied ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// GET /status  ->  { "moisture": 0-100, "temperature": 22.5 }
export async function getStatus(): Promise<Status> {
  if (CONFIG.USE_MOCK) return mockStatus();
  return fetchJson('/status');
}

// POST /water  ->  { "ok": true }  (or an error while the pump is cooling down)
export async function waterPlant(): Promise<void> {
  if (CONFIG.USE_MOCK) return mockWater();
  const r = await fetchJson('/water', { method: 'POST' });
  if (r && r.ok === false) throw new Error(r.error ?? 'Could not water');
}
