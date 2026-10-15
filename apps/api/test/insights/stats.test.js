import { describe, expect, it } from 'vitest';
import { histogram, median } from '../../src/insights/stats.js';

describe('median', () => {
  it('is the middle value of an odd-length list', () => {
    expect(median([10, 30, 20])).toBe(20);
  });

  it('is the rounded mean of the two middle values of an even-length list', () => {
    expect(median([10, 20, 30, 41])).toBe(25);
  });

  it('is null for no values', () => {
    expect(median([])).toBeNull();
  });
});

describe('histogram', () => {
  it('splits the range into equal-width bins that count every value once', () => {
    const bins = histogram([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 5);

    expect(bins).toEqual([
      { from: 0, to: 20, count: 2 },
      { from: 20, to: 40, count: 2 },
      { from: 40, to: 60, count: 2 },
      { from: 60, to: 80, count: 2 },
      { from: 80, to: 100, count: 3 },
    ]);
  });

  it('puts identical values into a single bin', () => {
    expect(histogram([50, 50, 50], 4)).toEqual([{ from: 50, to: 50, count: 3 }]);
  });

  it('is empty for no values', () => {
    expect(histogram([], 5)).toEqual([]);
  });
});
