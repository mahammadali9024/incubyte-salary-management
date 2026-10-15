import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from '../db.js';
import { anEmployee, fixedClock } from '../fixtures.js';
import { createEmployeeService } from '../../src/employees/employee-service.js';
import { createInsightsService } from '../../src/insights/insights-service.js';

describe('InsightsService', () => {
  let insights;

  beforeEach(() => {
    const db = testDb();
    const employees = createEmployeeService(db, fixedClock('2026-10-15'));
    let n = 0;
    const hire = (overrides) =>
      employees.create(anEmployee({ email: `e${++n}@acme.test`, ...overrides }));

    // India: engineers 1.0M, 2.0M, 6.0M INR; one designer 1.5M INR
    hire({ country: 'India', jobTitle: 'Software Engineer', annualSalary: 1_000_000 });
    hire({ country: 'India', jobTitle: 'Software Engineer', annualSalary: 2_000_000 });
    hire({ country: 'India', jobTitle: 'Software Engineer', annualSalary: 6_000_000 });
    hire({ country: 'India', jobTitle: 'Designer', department: 'Design', annualSalary: 1_500_000 });
    // United States: 100k and 150k USD in Sales
    hire({
      country: 'United States',
      department: 'Sales',
      jobTitle: 'Sales Executive',
      annualSalary: 100_000,
    });
    hire({
      country: 'United States',
      department: 'Sales',
      jobTitle: 'Sales Executive',
      annualSalary: 150_000,
    });

    insights = createInsightsService(db);
  });

  it('summarises the whole organisation in USD', () => {
    // INR total 10.5M × 0.012 = 126,000 + USD 250,000
    expect(insights.overview()).toEqual({ headcount: 6, totalPayrollUsd: 376_000, countries: 2 });
  });

  it('reports min, max, average and median per country in local currency and USD', () => {
    const india = insights.byCountry().find((c) => c.country === 'India');

    expect(india).toEqual({
      country: 'India',
      currency: 'INR',
      headcount: 4,
      min: 1_000_000,
      max: 6_000_000,
      average: 2_625_000,
      median: 1_750_000,
      averageUsd: 31_500,
      medianUsd: 21_000,
    });
  });

  it('orders countries by headcount, largest first', () => {
    expect(insights.byCountry().map((c) => c.country)).toEqual(['India', 'United States']);
  });

  it('reports average salary per job title within a country', () => {
    expect(insights.byJobTitle('India')).toEqual([
      {
        jobTitle: 'Software Engineer',
        headcount: 3,
        min: 1_000_000,
        max: 6_000_000,
        average: 3_000_000,
        median: 2_000_000,
        currency: 'INR',
        averageUsd: 36_000,
      },
      {
        jobTitle: 'Designer',
        headcount: 1,
        min: 1_500_000,
        max: 1_500_000,
        average: 1_500_000,
        median: 1_500_000,
        currency: 'INR',
        averageUsd: 18_000,
      },
    ]);
  });

  it('reports headcount and USD payroll per department, largest payroll first', () => {
    expect(insights.byDepartment()).toEqual([
      { department: 'Sales', headcount: 2, totalPayrollUsd: 250_000, averageUsd: 125_000 },
      { department: 'Engineering', headcount: 3, totalPayrollUsd: 108_000, averageUsd: 36_000 },
      { department: 'Design', headcount: 1, totalPayrollUsd: 18_000, averageUsd: 18_000 },
    ]);
  });

  it('builds a salary distribution for a country', () => {
    const bins = insights.distribution('India', 5);

    expect(bins.reduce((sum, b) => sum + b.count, 0)).toBe(4);
    expect(bins[0]).toMatchObject({ from: 1_000_000, to: 2_000_000, count: 2 });
    expect(bins.at(-1)).toMatchObject({ to: 6_000_000, count: 1 });
  });

  it('returns empty results for a country with no employees', () => {
    expect(insights.byJobTitle('Japan')).toEqual([]);
    expect(insights.distribution('Japan')).toEqual([]);
  });
});
