import { beforeEach, describe, expect, it } from 'vitest';
import { employeeListQuerySchema } from '@acme/shared';
import { testDb } from '../db.js';
import { anEmployee, fixedClock } from '../fixtures.js';
import { createEmployeeService } from '../../src/employees/employee-service.js';

const query = (q = {}) => employeeListQuerySchema.parse(q);

describe('EmployeeService.list', () => {
  let service;

  beforeEach(() => {
    service = createEmployeeService(testDb(), fixedClock('2026-10-15'));
    service.create(
      anEmployee({
        fullName: 'Asha Rao',
        email: 'asha@acme.test',
        country: 'India',
        annualSalary: 1_800_000,
      }),
    );
    service.create(
      anEmployee({
        fullName: 'Ben Carter',
        email: 'ben@acme.test',
        country: 'United States',
        department: 'Sales',
        jobTitle: 'Sales Executive',
        annualSalary: 90_000,
      }),
    );
    service.create(
      anEmployee({
        fullName: 'Chloe Martin',
        email: 'chloe@acme.test',
        country: 'United Kingdom',
        annualSalary: 65_000,
      }),
    );
  });

  it('pages results and reports the total', () => {
    const page = service.list(query({ page: 2, pageSize: 2 }));

    expect(page).toMatchObject({ total: 3, page: 2, pageSize: 2 });
    expect(page.items.map((e) => e.fullName)).toEqual(['Chloe Martin']);
  });

  it('searches by name or email, case-insensitively', () => {
    expect(service.list(query({ search: 'carter' })).items.map((e) => e.email)).toEqual([
      'ben@acme.test',
    ]);
    expect(service.list(query({ search: 'CHLOE@' })).items.map((e) => e.fullName)).toEqual([
      'Chloe Martin',
    ]);
  });

  it('treats wildcard characters in a search literally', () => {
    expect(service.list(query({ search: '%' })).total).toBe(0);
  });

  it('filters by country, department and job title together', () => {
    const page = service.list(
      query({ country: 'United States', department: 'Sales', jobTitle: 'Sales Executive' }),
    );

    expect(page.items.map((e) => e.fullName)).toEqual(['Ben Carter']);
  });

  it('sorts by the requested field and direction', () => {
    const names = service
      .list(query({ sortBy: 'fullName', sortDir: 'desc' }))
      .items.map((e) => e.fullName);

    expect(names).toEqual(['Chloe Martin', 'Ben Carter', 'Asha Rao']);
  });

  it('sorts salaries by their USD equivalent so currencies compare fairly', () => {
    // 1.8M INR ≈ $21.6k, 65k GBP ≈ $82.6k, 90k USD = $90k
    const page = service.list(query({ sortBy: 'annualSalary', sortDir: 'desc' }));

    expect(page.items.map((e) => [e.fullName, e.annualSalaryUsd])).toEqual([
      ['Ben Carter', 90_000],
      ['Chloe Martin', 82_550],
      ['Asha Rao', 21_600],
    ]);
  });
});
