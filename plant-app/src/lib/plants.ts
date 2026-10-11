import { CONFIG } from './config';

// Broad plant groups with typical care. These are rough starting points, not rules:
// the moisture sensor is still the best guide for when to water.
export type PlantTypeId = 'succulent' | 'leafy' | 'flowering' | 'herb' | 'fern' | 'veggie' | 'other';
export type Units = 'metric' | 'imperial';

export type PlantType = {
  label: string; // shown lowercase everywhere, to match the app's style
  examples: string;
  dryBelow: number; // % moisture where it counts as thirsty
  wetAbove: number; // % moisture where it counts as soaked
  everyDays: number; // typical days between waterings indoors
  ml: number; // water per watering, for a typical pot (about 15 cm / 6 in across)
  tip: string; // {depth} becomes "2–3 centimeters" or "inch" depending on units
};

export const PLANT_TYPES: Record<PlantTypeId, PlantType> = {
  succulent: {
    label: 'succulent / cactus', examples: 'aloe, jade, echeveria, cactus',
    dryBelow: 15, wetAbove: 50, everyDays: 14, ml: 150,
    tip: 'Let the soil dry out completely before watering again.',
  },
  leafy: {
    label: 'leafy houseplant', examples: 'pothos, monstera, philodendron, snake plant',
    dryBelow: 30, wetAbove: 70, everyDays: 7, ml: 300,
    tip: 'Water when the top {depth} of soil feels dry.',
  },
  flowering: {
    label: 'flowering plant', examples: 'peace lily, begonia, African violet',
    dryBelow: 35, wetAbove: 75, everyDays: 5, ml: 250,
    tip: 'Keep the soil lightly moist, especially while it is blooming.',
  },
  herb: {
    label: 'herbs', examples: 'basil, mint, parsley, cilantro',
    dryBelow: 40, wetAbove: 80, everyDays: 3, ml: 200,
    tip: 'Herbs drink fast in sunny windows. Check them every couple of days.',
  },
  fern: {
    label: 'fern / moisture lover', examples: 'Boston fern, calathea, maidenhair',
    dryBelow: 45, wetAbove: 85, everyDays: 3, ml: 250,
    tip: 'Never let these dry out fully. They like soil that stays damp.',
  },
  veggie: {
    label: 'veggies & fruit', examples: 'tomato, pepper, strawberry, lettuce',
    dryBelow: 40, wetAbove: 80, everyDays: 2, ml: 400,
    tip: 'Fruiting plants need steady water. Uneven watering can crack fruit.',
  },
  other: {
    label: 'something else', examples: 'general houseplant care',
    dryBelow: 30, wetAbove: 70, everyDays: 7, ml: 250,
    tip: 'Check your plant’s care tag. You can fine-tune the thirsty level in Settings.',
  },
};

export const PLANT_TYPE_IDS = Object.keys(PLANT_TYPES) as PlantTypeId[];

export type Recommendation = {
  ml: number; // how much water per watering
  presses: number; // how many pump presses that takes
  everyDays: number;
  pressesPerWeek: number;
  secondsPerPress: number;
};

// How many presses of the Water button make one proper watering.
// One press runs the pump for CONFIG.PUMP_ON_MS (5 s) and moves about CONFIG.ML_PER_PRESS of water.
export function recommend(type: PlantTypeId): Recommendation {
  const t = PLANT_TYPES[type];
  const ml = t.ml;
  const presses = Math.max(1, Math.round(ml / CONFIG.ML_PER_PRESS));
  return {
    ml,
    presses,
    everyDays: t.everyDays,
    pressesPerWeek: Math.max(1, Math.round((presses * 7) / t.everyDays)),
    secondsPerPress: CONFIG.PUMP_ON_MS / 1000,
  };
}

export const everyLabel = (days: number) =>
  days <= 1 ? 'every day' : days === 7 ? 'about once a week' : days === 14 ? 'about every 2 weeks' : `every ${days} days`;

// ---- Units ----

// Water amount, e.g. "~300 ml" or "~10 fl oz".
export const formatWater = (ml: number, units: Units) =>
  units === 'imperial' ? `~${Math.max(1, Math.round(ml / 29.57))} fl oz` : `~${Math.round(ml / 10) * 10} ml`;

export const tipFor = (type: PlantTypeId, units: Units) =>
  PLANT_TYPES[type].tip.replace('{depth}', units === 'imperial' ? 'inch' : '2–3 centimeters');
