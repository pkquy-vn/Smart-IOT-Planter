import { dayKey, type PlantEvent } from './dates';

// Streaks and badges for the journal, worked out from the watering / thirsty log.

const DAY = 86400000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export type Badge = { id: string; mark: string; title: string; detail: string; earned: boolean };

export type Milestones = {
  daysTogether: number; // 1 on the first day
  happyStreak: number; // days in a row (ending today) without getting thirsty
  bestStreak: number;
  waterings: number;
  badges: Badge[];
};

export function milestones(events: PlantEvent[], since: number, now: number): Milestones {
  const thirstyDays = new Set(events.filter((e) => e.kind === 'dry').map((e) => dayKey(new Date(e.t))));
  const waterings = events.filter((e) => e.kind === 'water').length;
  const first = startOfDay(since);
  const today = startOfDay(now);
  const daysTogether = Math.max(1, Math.round((today - first) / DAY) + 1);

  // Walk every day since setup, counting runs of days with no thirsty moment.
  let run = 0;
  let bestStreak = 0;
  for (let t = first; t <= today; t += DAY) {
    run = thirstyDays.has(dayKey(new Date(t))) ? 0 : run + 1;
    bestStreak = Math.max(bestStreak, run);
  }
  const happyStreak = run;

  const badges: Badge[] = [
    { id: 'first', mark: '1', title: 'first sip', detail: 'watered for the first time', earned: waterings >= 1 },
    { id: 'w10', mark: '10', title: '10 waterings', detail: 'pressed water 10 times', earned: waterings >= 10 },
    { id: 'w50', mark: '50', title: '50 waterings', detail: 'pressed water 50 times', earned: waterings >= 50 },
    { id: 'h7', mark: '7', title: 'happy week', detail: '7 days in a row without getting thirsty', earned: bestStreak >= 7 },
    { id: 'h30', mark: '30', title: 'happy month', detail: '30 days in a row without getting thirsty', earned: bestStreak >= 30 },
    { id: 't7', mark: '1w', title: 'one week together', detail: 'a week since you set up your plant', earned: daysTogether >= 7 },
    { id: 't30', mark: '1m', title: 'one month together', detail: 'a month since you set up your plant', earned: daysTogether >= 30 },
    { id: 't100', mark: '100', title: '100 days together', detail: '100 days since you set up your plant', earned: daysTogether >= 100 },
  ];

  return { daysTogether, happyStreak, bestStreak, waterings, badges };
}
