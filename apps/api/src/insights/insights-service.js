import { asc, avg, count, countDistinct, desc, eq, max, min, sql, sum } from 'drizzle-orm';
import { toUsd } from '@acme/shared';
import { employees } from '../db/schema.js';
import { salaryInUsd } from '../employees/usd-sql.js';
import { histogram, median } from './stats.js';

const DEFAULT_BINS = 10;

/**
 * Fixed pay insights. Aggregates run in SQL; medians and histograms are computed
 * from the (small) set of salaries in a group.
 *
 * @param {import('../db/client.js').Db} db
 */
export function createInsightsService(db) {
  function salariesBy(key, where) {
    const groups = new Map();
    const rows = db
      .select({ key, salary: employees.annualSalary })
      .from(employees)
      .where(where)
      .all();
    for (const { key: k, salary } of rows) {
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(salary);
    }
    return groups;
  }

  return {
    overview() {
      const row = db
        .select({
          headcount: count(),
          totalPayrollUsd: sql`coalesce(round(sum(${salaryInUsd()})), 0)`.mapWith(Number),
          countries: countDistinct(employees.country),
        })
        .from(employees)
        .get();
      return row;
    },

    byCountry() {
      const medians = salariesBy(employees.country);
      return db
        .select({
          country: employees.country,
          currency: employees.currency,
          headcount: count(),
          min: min(employees.annualSalary),
          max: max(employees.annualSalary),
          average: avg(employees.annualSalary).mapWith(Number),
        })
        .from(employees)
        .groupBy(employees.country, employees.currency)
        .orderBy(desc(count()), asc(employees.country))
        .all()
        .map((row) => {
          const average = Math.round(row.average);
          const med = median(medians.get(row.country));
          return {
            ...row,
            average,
            median: med,
            averageUsd: toUsd(average, row.currency),
            medianUsd: toUsd(med, row.currency),
          };
        });
    },

    byJobTitle(country) {
      const inCountry = eq(employees.country, country);
      const medians = salariesBy(employees.jobTitle, inCountry);
      return db
        .select({
          jobTitle: employees.jobTitle,
          headcount: count(),
          min: min(employees.annualSalary),
          max: max(employees.annualSalary),
          average: avg(employees.annualSalary).mapWith(Number),
          currency: employees.currency,
        })
        .from(employees)
        .where(inCountry)
        .groupBy(employees.jobTitle, employees.currency)
        .orderBy(desc(avg(employees.annualSalary)), asc(employees.jobTitle))
        .all()
        .map((row) => {
          const average = Math.round(row.average);
          return {
            jobTitle: row.jobTitle,
            headcount: row.headcount,
            min: row.min,
            max: row.max,
            average,
            median: median(medians.get(row.jobTitle)),
            currency: row.currency,
            averageUsd: toUsd(average, row.currency),
          };
        });
    },

    byDepartment() {
      const totalUsd = sql`round(${sum(salaryInUsd())})`.mapWith(Number);
      return db
        .select({
          department: employees.department,
          headcount: count(),
          totalPayrollUsd: totalUsd,
        })
        .from(employees)
        .groupBy(employees.department)
        .orderBy(desc(totalUsd), asc(employees.department))
        .all()
        .map((row) => ({ ...row, averageUsd: Math.round(row.totalPayrollUsd / row.headcount) }));
    },

    distribution(country, bins = DEFAULT_BINS) {
      const salaries = salariesBy(employees.country, eq(employees.country, country)).get(country);
      return histogram(salaries ?? [], bins);
    },
  };
}
