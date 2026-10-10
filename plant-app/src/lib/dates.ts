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
