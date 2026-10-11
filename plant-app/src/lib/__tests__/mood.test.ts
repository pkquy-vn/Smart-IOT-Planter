import { describe, expect, test } from '@jest/globals';
import { moistureLabel, sproutMoodFor } from '../mood';

describe('sproutMoodFor', () => {
  const dry = 30;
  const wet = 70;

  test('no reading yet is neutral', () => {
    expect(sproutMoodFor(null, 1, dry, wet)).toBe('ok');
  });

  test('wet soil is never sad, even with no watering logged', () => {
    expect(sproutMoodFor(55, null, dry, wet)).toBe('happy');
    expect(sproutMoodFor(55, 100, dry, wet)).toBe('happy');
  });

  test('dry soil is thirsty, and sad once it has been dry for a long time', () => {
    expect(sproutMoodFor(20, 2, dry, wet)).toBe('thirsty');
    expect(sproutMoodFor(20, 49, dry, wet)).toBe('sad');
    expect(sproutMoodFor(20, null, dry, wet)).toBe('sad');
  });

  test('soaked is joyful, and only past the too-wet level is it too much', () => {
    expect(sproutMoodFor(80, 1, dry, wet, 48, 85)).toBe('joy');
    expect(sproutMoodFor(90, 1, dry, wet, 48, 85)).toBe('wet');
    expect(sproutMoodFor(35, 1, dry, wet)).toBe('ok');
  });

  test('how long "dry for a long time" is depends on the plant type', () => {
    // A cactus (14 days) isn't sad after 3 dry days; herbs (3 days) are.
    expect(sproutMoodFor(10, 72, dry, wet, 14 * 24)).toBe('thirsty');
    expect(sproutMoodFor(10, 80, dry, wet, 3 * 24)).toBe('sad');
  });
});

describe('moistureLabel', () => {
  test('bands', () => {
    expect(moistureLabel(10, 30, 70, 85)).toBe('Thirsty');
    expect(moistureLabel(50, 30, 70, 85)).toBe('Happy');
    expect(moistureLabel(80, 30, 70, 85)).toBe('Soaked');
    expect(moistureLabel(90, 30, 70, 85)).toBe('Too wet');
  });
});
