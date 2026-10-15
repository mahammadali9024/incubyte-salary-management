import { USD_PER_UNIT } from './reference-data.js';

/**
 * Converts a whole-unit amount to USD, rounded to the nearest dollar.
 * @param {number} amount
 * @param {string} currency
 */
export function toUsd(amount, currency) {
  const rate = USD_PER_UNIT[currency];
  if (rate === undefined) throw new Error(`No exchange rate for ${currency}`);
  return Math.round(amount * rate);
}
