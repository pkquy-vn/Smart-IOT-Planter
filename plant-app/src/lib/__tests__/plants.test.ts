import { describe, expect, test } from '@jest/globals';
import { formatWater, recommend, tipFor } from '../plants';

describe('recommend', () => {
  test('turns the water a plant needs into presses of the 5-second pump', () => {
    // leafy: 300 ml at 120 ml a press
    expect(recommend('leafy')).toMatchObject({ ml: 300, presses: 3, everyDays: 7, secondsPerPress: 5 });
    // always at least one press
    expect(recommend('succulent').presses).toBeGreaterThanOrEqual(1);
  });
});

describe('units', () => {
  test('water amounts', () => {
    expect(formatWater(300, 'metric')).toBe('~300 ml');
    expect(formatWater(300, 'imperial')).toBe('~10 fl oz');
  });

  test('soil depth in the leafy tip', () => {
    expect(tipFor('leafy', 'metric')).toContain('2–3 centimeters');
    expect(tipFor('leafy', 'imperial')).toContain('top inch');
  });
});
