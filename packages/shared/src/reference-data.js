/**
 * Reference data shared by the API (validation, seeding) and the UI (form options).
 * Kept as code so changes are reviewed and versioned like any other change.
 */

export const COUNTRIES = [
  { name: 'India', currency: 'INR' },
  { name: 'United States', currency: 'USD' },
  { name: 'United Kingdom', currency: 'GBP' },
  { name: 'Germany', currency: 'EUR' },
  { name: 'Canada', currency: 'CAD' },
  { name: 'Australia', currency: 'AUD' },
  { name: 'Singapore', currency: 'SGD' },
  { name: 'Japan', currency: 'JPY' },
];

export const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

/**
 * @param {string} country
 * @returns {string} ISO currency code
 */
export function currencyFor(country) {
  const match = COUNTRIES.find((c) => c.name === country);
  if (!match) throw new Error(`Unknown country: ${country}`);
  return match.currency;
}

/**
 * Fixed conversion rates: how many USD one unit of the currency is worth.
 * Fixed (not live) so reports are reproducible. Snapshot taken 2026-10-01.
 */
export const USD_PER_UNIT = {
  USD: 1,
  INR: 0.012,
  GBP: 1.27,
  EUR: 1.09,
  CAD: 0.73,
  AUD: 0.66,
  SGD: 0.74,
  JPY: 0.0067,
};

export const FX_RATES_AS_OF = '2026-10-01';

export const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Finance',
  'Human Resources',
  'Operations',
  'Customer Support',
];


export const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Engineering Manager',
  'Product Manager',
  'Designer',
  'Data Analyst',
  'Sales Executive',
  'Account Manager',
  'Marketing Specialist',
  'Accountant',
  'HR Generalist',
  'Operations Associate',
  'Support Specialist',
];


export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract'];

