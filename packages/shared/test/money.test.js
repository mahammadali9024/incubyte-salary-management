import { describe, expect, it } from 'vitest';
import { toUsd } from '../src/money.js';

describe('toUsd', () => {
  it('leaves USD unchanged', () => {
    expect(toUsd(120_000, 'USD')).toBe(120_000);
  });

  it('converts using the fixed rate and rounds to whole dollars', () => {
    expect(toUsd(1_000_000, 'INR')).toBe(12_000);
    expect(toUsd(10_001, 'GBP')).toBe(12_701);
  });
});

describe('toUsd with an unknown currency', () => {
  it('fails loudly instead of returning NaN', () => {
    expect(() => toUsd(100, 'XYZ')).toThrow(/No exchange rate/);
  });
});
