import { describe, expect, it } from 'vitest';
import { formatCompact, formatMoney } from './format.js';

describe('formatMoney', () => {
  it('formats whole amounts in the given currency without decimals', () => {
    expect(formatMoney(90000, 'USD')).toBe('$90,000');
    expect(formatMoney(65000, 'GBP')).toBe('£65,000');
  });

  it('uses Indian digit grouping for rupees', () => {
    expect(formatMoney(1800000, 'INR')).toBe('₹18,00,000');
  });

  it('shows a dash for a missing amount', () => {
    expect(formatMoney(null, 'USD')).toBe('—');
  });
});

describe('formatCompact', () => {
  it('abbreviates large numbers', () => {
    expect(formatCompact(633_467_803)).toBe('633.5M');
  });
});
