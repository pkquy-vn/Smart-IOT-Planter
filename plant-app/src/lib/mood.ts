export type SproutMood = 'happy' | 'ok' | 'sad' | 'wet' | 'thirsty';

// How the big sprout feels. Driven by the soil first; the watering journal only
// deepens an already-thirsty mood, so a plant watered by hand (never logged in
// the app) is never shown sad while its soil is wet.
export function sproutMoodFor(moisturePct: number | null, hoursSinceWater: number | null, dryBelow: number, wetAbove: number): SproutMood {
  if (moisturePct == null) return 'ok';
  if (moisturePct < dryBelow) {
    const longDry = hoursSinceWater == null || hoursSinceWater > 48;
    return longDry ? 'sad' : 'thirsty';
  }
  if (moisturePct > wetAbove) return 'wet';
  if (moisturePct < dryBelow + 10) return 'ok';
  return 'happy';
}

export function moistureLabel(m: number, dryBelow: number, wetAbove: number) {
  if (m < dryBelow) return 'Thirsty';
  if (m > wetAbove) return 'Very wet';
  return 'Happy';
}

export const moodMessage: Record<SproutMood, string> = {
  sad: 'Please water me…',
  thirsty: 'I need a drink!',
  wet: 'Phew, soaked!',
  happy: 'Feeling great!',
  ok: 'Just hanging out',
};

// A jump this large between two polls means the plant just got watered,
// whether through the app or by hand.
export const WATERING_JUMP_PCT = 15;
