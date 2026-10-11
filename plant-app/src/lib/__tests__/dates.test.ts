import { describe, expect, test } from '@jest/globals';
import { dayKey, eventsByDay, moodFor, type PlantEvent } from '../dates';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).getTime();

describe('dates', () => {
  const events: PlantEvent[] = [
    { t: at(2026, 9, 1), kind: 'water' },
    { t: at(2026, 9, 1, 18), kind: 'dry' },
    { t: at(2026, 9, 3), kind: 'dry' },
  ];
  const byDay = eventsByDay(events);
  const today = new Date(2026, 9, 5);

  test('groups events by local day', () => {
    expect(byDay[dayKey(new Date(2026, 9, 1))]).toHaveLength(2);
    expect(byDay[dayKey(new Date(2026, 9, 3))]).toHaveLength(1);
  });

  test('a watering wins over a dry spell on the same day', () => {
    expect(moodFor(new Date(2026, 9, 1), byDay, today)).toBe('happy');
  });

  test('dry days are sad, quiet days are ok, future days are empty', () => {
    expect(moodFor(new Date(2026, 9, 3), byDay, today)).toBe('sad');
    expect(moodFor(new Date(2026, 9, 4), byDay, today)).toBe('ok');
    expect(moodFor(new Date(2026, 9, 6), byDay, today)).toBe('empty');
  });
});
