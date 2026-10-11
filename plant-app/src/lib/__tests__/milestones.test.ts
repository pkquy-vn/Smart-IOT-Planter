import { describe, expect, test } from '@jest/globals';
import type { PlantEvent } from '../dates';
import { milestones } from '../milestones';

const at = (d: number, h = 12) => new Date(2026, 9, d, h).getTime();

describe('milestones', () => {
  const since = at(1, 9);
  const events: PlantEvent[] = [
    { t: at(1), kind: 'water' },
    { t: at(4), kind: 'dry' },
    { t: at(4, 14), kind: 'water' },
  ];

  test('counts days together and the happy streak since the last thirsty day', () => {
    const m = milestones(events, since, at(10));
    expect(m.daysTogether).toBe(10);
    expect(m.happyStreak).toBe(6); // Oct 5-10
    expect(m.bestStreak).toBe(6);
    expect(m.waterings).toBe(2);
  });

  test('badges unlock at their thresholds', () => {
    const earned = (now: number) => milestones(events, since, now).badges.filter((b) => b.earned).map((b) => b.id);
    expect(earned(at(3))).toEqual(['first']);
    expect(earned(at(11))).toEqual(['first', 'h7', 't7']);
  });
});
