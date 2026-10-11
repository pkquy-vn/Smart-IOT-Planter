export type PlantEvent = { t: number; kind: 'water' | 'dry' };

export const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function eventsByDay(events: PlantEvent[]) {
  const map: Record<string, PlantEvent[]> = {};
  for (const e of events) (map[dayKey(new Date(e.t))] ??= []).push(e);
  return map;
}

export type DayMood = 'happy' | 'ok' | 'sad' | 'empty';

export function moodFor(date: Date, byDay: Record<string, PlantEvent[]>, today = new Date()): DayMood {
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (start(date) > start(today)) return 'empty';
  const evs = byDay[dayKey(date)] ?? [];
  if (evs.some((e) => e.kind === 'water')) return 'happy';
  if (evs.some((e) => e.kind === 'dry')) return 'sad';
  return 'ok';
}

// Fake history so the calendar looks alive in demo mode.
export function seedHistory(): PlantEvent[] {
  const out: PlantEvent[] = [];
  const now = new Date();
  for (let i = 1; i <= 45; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    if (i % 5 === 2) out.push({ t: d.setHours(9, 30), kind: 'water' });
    else if (i % 9 === 4) out.push({ t: d.setHours(14, 0), kind: 'dry' });
  }
  return out;
}

// One moisture sample for the history chart.
export type Reading = { t: number; m: number };

// Fake week of moisture readings for demo mode: slow drying, jumping back up on watering days.
export function seedReadings(events: PlantEvent[], everyMs: number, days: number): Reading[] {
  const out: Reading[] = [];
  const waters = events.filter((e) => e.kind === 'water').map((e) => e.t);
  let m = 60;
  for (let t = Date.now() - days * 86400000; t < Date.now(); t += everyMs) {
    m -= 0.07 + Math.random() * 0.04; // roughly 15% a day, like a pot near a window
    if (waters.some((w) => w > t - everyMs && w <= t)) m += 35;
    m = Math.max(8, Math.min(92, m));
    out.push({ t, m: Math.round(m) });
  }
  return out;
}

// One line per kind of event on a day (latest time + how many), so repeat logs don't stack up.
export function summarizeDay(events: PlantEvent[]) {
  return (['water', 'dry'] as const)
    .map((kind) => {
      const times = events.filter((e) => e.kind === kind).map((e) => e.t);
      return { kind, count: times.length, last: times.length ? Math.max(...times) : 0 };
    })
    .filter((s) => s.count > 0)
    .sort((a, b) => a.last - b.last);
}
