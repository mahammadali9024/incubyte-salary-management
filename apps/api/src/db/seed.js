import { Faker, en } from '@faker-js/faker';
import { count } from 'drizzle-orm';
import { USD_PER_UNIT, currencyFor } from '@acme/shared';
import { employees, salaryChanges } from './schema.js';

/** US-level median base salary (USD) and the department each title belongs to. */
const ROLES = [
  { title: 'Software Engineer', department: 'Engineering', baseUsd: 120_000, weight: 25 },
  { title: 'Senior Software Engineer', department: 'Engineering', baseUsd: 165_000, weight: 12 },
  { title: 'Engineering Manager', department: 'Engineering', baseUsd: 200_000, weight: 4 },
  { title: 'Data Analyst', department: 'Engineering', baseUsd: 95_000, weight: 5 },
  { title: 'Product Manager', department: 'Product', baseUsd: 150_000, weight: 5 },
  { title: 'Designer', department: 'Design', baseUsd: 110_000, weight: 5 },
  { title: 'Sales Executive', department: 'Sales', baseUsd: 85_000, weight: 10 },
  { title: 'Account Manager', department: 'Sales', baseUsd: 100_000, weight: 6 },
  { title: 'Marketing Specialist', department: 'Marketing', baseUsd: 80_000, weight: 5 },
  { title: 'Accountant', department: 'Finance', baseUsd: 80_000, weight: 4 },
  { title: 'HR Generalist', department: 'Human Resources', baseUsd: 70_000, weight: 3 },
  { title: 'Operations Associate', department: 'Operations', baseUsd: 60_000, weight: 8 },
  { title: 'Support Specialist', department: 'Customer Support', baseUsd: 55_000, weight: 8 },
];

/** Share of the workforce and pay level relative to the US, per country. */
const LOCATIONS = [
  { country: 'India', weight: 35, payFactor: 0.22 },
  { country: 'United States', weight: 20, payFactor: 1 },
  { country: 'United Kingdom', weight: 10, payFactor: 0.65 },
  { country: 'Germany', weight: 8, payFactor: 0.7 },
  { country: 'Canada', weight: 7, payFactor: 0.75 },
  { country: 'Singapore', weight: 7, payFactor: 0.7 },
  { country: 'Japan', weight: 7, payFactor: 0.55 },
  { country: 'Australia', weight: 6, payFactor: 0.75 },
];

const EMPLOYMENT = [
  { value: 'Full-time', weight: 85, payShare: 1 },
  { value: 'Contract', weight: 10, payShare: 1 },
  { value: 'Part-time', weight: 5, payShare: 0.5 },
];

const EARLIEST_JOINING = '2012-01-01';
const LATEST_JOINING = '2026-09-30';
const BATCH_SIZE = 500;

const weighted = (faker, items) =>
  faker.helpers.weightedArrayElement(items.map((item) => ({ weight: item.weight, value: item })));

/** Rounds to a "payroll-looking" figure: nearest 1,000 units, or 10,000 for low-value currencies. */
function roundSalary(amount, currency) {
  const step = USD_PER_UNIT[currency] < 0.05 ? 10_000 : 1_000;
  return Math.max(step, Math.round(amount / step) * step);
}

const isoDate = (date) => date.toISOString().slice(0, 10);

/**
 * Generates `total` employees deterministically from `seed`. Pure: no database access.
 * Each employee carries its salary history (oldest first).
 */
export function generateEmployees(total, seed = 42) {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);
  const people = [];

  for (let i = 1; i <= total; i++) {
    const role = weighted(faker, ROLES);
    const location = weighted(faker, LOCATIONS);
    const employment = weighted(faker, EMPLOYMENT);
    const currency = currencyFor(location.country);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const joiningDate = isoDate(faker.date.between({ from: EARLIEST_JOINING, to: LATEST_JOINING }));

    const spread = faker.number.float({ min: 0.8, max: 1.2 });
    const usd = role.baseUsd * location.payFactor * employment.payShare * spread;
    const startingSalary = roundSalary(usd / USD_PER_UNIT[currency], currency);

    const history = [{ annualSalary: startingSalary, effectiveDate: joiningDate }];
    const hasRaise = joiningDate < '2025-10-01' && faker.datatype.boolean({ probability: 0.4 });
    if (hasRaise) {
      const raise = faker.number.float({ min: 1.03, max: 1.15 });
      history.push({
        annualSalary: roundSalary(startingSalary * raise, currency),
        effectiveDate: isoDate(faker.date.between({ from: joiningDate, to: LATEST_JOINING })),
      });
    }

    people.push({
      fullName: `${firstName} ${lastName}`,
      email: faker.internet
        .email({ firstName, lastName: `${lastName}.${i}`, provider: 'acme.example' })
        .toLowerCase(),
      jobTitle: role.title,
      department: role.department,
      country: location.country,
      currency,
      employmentType: employment.value,
      joiningDate,
      annualSalary: history.at(-1).annualSalary,
      history,
    });
  }
  return people;
}

/**
 * Inserts generated employees and their salary history in one transaction.
 * @param {import('./client.js').Db} db
 */
export function seedEmployees(db, { total = 10_000, seed = 42 } = {}) {
  const people = generateEmployees(total, seed);
  db.transaction((tx) => {
    for (let start = 0; start < people.length; start += BATCH_SIZE) {
      const batch = people.slice(start, start + BATCH_SIZE);
      // eslint-disable-next-line no-unused-vars
      const rows = batch.map(({ history, ...employee }) => employee);
      const inserted = tx.insert(employees).values(rows).returning({ id: employees.id }).all();
      const changes = batch.flatMap((person, i) =>
        person.history.map((change) => ({
          ...change,
          employeeId: inserted[i].id,
          currency: person.currency,
        })),
      );
      tx.insert(salaryChanges).values(changes).run();
    }
  });
  return people.length;
}

/** @param {import('./client.js').Db} db */
export function isEmpty(db) {
  return db.select({ n: count() }).from(employees).get().n === 0;
}
