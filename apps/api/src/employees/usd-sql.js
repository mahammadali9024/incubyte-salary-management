import { sql } from 'drizzle-orm';
import { USD_PER_UNIT } from '@acme/shared';
import { employees } from '../db/schema.js';

/**
 * SQL expression for an employee's salary in USD, using the fixed rates.
 * Lets the database sort and aggregate across currencies.
 */
export function salaryInUsd() {
  const cases = Object.entries(USD_PER_UNIT).map(
    ([currency, rate]) => sql`when ${currency} then ${employees.annualSalary} * ${rate}`,
  );
  return sql`(case ${employees.currency} ${sql.join(cases, sql` `)} end)`;
}
