/**
 * Median of a list of numbers, rounded to a whole unit. Null when empty.
 * @param {number[]} values
 */
export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Equal-width histogram over the range of the values. The last bin is closed
 * so the maximum is counted.
 * @param {number[]} values
 * @param {number} binCount
 * @returns {{ from: number, to: number, count: number }[]}
 */
export function histogram(values, binCount) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ from: min, to: max, count: values.length }];

  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    from: Math.round(min + i * width),
    to: i === binCount - 1 ? max : Math.round(min + (i + 1) * width),
    count: 0,
  }));
  for (const value of values) {
    const index = Math.min(Math.floor((value - min) / width), binCount - 1);
    bins[index].count += 1;
  }
  return bins;
}
