// joy = nicely soaked (happy face, hopping); wet = too much water.
export type SproutMood = 'joy' | 'happy' | 'ok' | 'sad' | 'wet' | 'thirsty';

// How the big sprout feels. Driven by the soil first; the watering journal only
// deepens an already-thirsty mood, so a plant watered by hand (never logged in
// the app) is never shown sad while its soil is wet.
// `sadAfterHours` comes from the plant type (e.g. 3 days for herbs, 14 for cacti).
export function sproutMoodFor(
  moisturePct: number | null,
  hoursSinceWater: number | null,
  dryBelow: number,
  wetAbove: number,
  sadAfterHours = 48,
  tooWet = Infinity,
): SproutMood {
  if (moisturePct == null) return 'ok';
  if (moisturePct < dryBelow) {
    const longDry = hoursSinceWater == null || hoursSinceWater > sadAfterHours;
    return longDry ? 'sad' : 'thirsty';
  }
  if (moisturePct > tooWet) return 'wet';
  if (moisturePct > wetAbove) return 'joy';
  if (moisturePct < dryBelow + 10) return 'ok';
  return 'happy';
}

export function moistureLabel(m: number, dryBelow: number, wetAbove: number, tooWet = Infinity) {
  if (m < dryBelow) return 'Thirsty';
  if (m > tooWet) return 'Too wet';
  if (m > wetAbove) return 'Soaked';
  return 'Happy';
}

export const moodMessage: Record<SproutMood, string> = {
  joy: 'Ahh, so refreshing!',
  sad: 'Please water me…',
  thirsty: 'I need a drink!',
  wet: 'Whoa, that’s a lot of water!',
  happy: 'Feeling great!',
  ok: 'Just hanging out',
};

// A jump this large between two polls means the plant just got watered,
// whether through the app or by hand.
export const WATERING_JUMP_PCT = 15;
