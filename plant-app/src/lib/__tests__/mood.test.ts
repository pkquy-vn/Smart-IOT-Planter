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

  test('soaked and borderline bands', () => {
    expect(sproutMoodFor(80, 1, dry, wet)).toBe('wet');
    expect(sproutMoodFor(35, 1, dry, wet)).toBe('ok');
  });
});

describe('moistureLabel', () => {
  test('bands', () => {
    expect(moistureLabel(10, 30, 70)).toBe('Thirsty');
    expect(moistureLabel(50, 30, 70)).toBe('Happy');
    expect(moistureLabel(90, 30, 70)).toBe('Very wet');
  });
});
