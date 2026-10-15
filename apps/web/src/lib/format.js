const moneyFormatters = new Map();

/** Formats a whole-unit amount in its currency, e.g. ₹18,00,000 or $90,000. */
export function formatMoney(amount, currency) {
  if (amount === null || amount === undefined) return '—';
  if (!moneyFormatters.has(currency)) {
    moneyFormatters.set(
      currency,
      new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }),
    );
  }
  return moneyFormatters.get(currency).format(amount);
}

export const formatUsd = (amount) => formatMoney(amount, 'USD');

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** Short form for chart axes and stat cards, e.g. 633.5M. */
export const formatCompact = (value) => compact.format(value);

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

export const todayIso = () => new Date().toISOString().slice(0, 10);
