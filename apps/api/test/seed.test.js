import { describe, expect, it } from 'vitest';
import { employeeInputSchema } from '@acme/shared';
import { generateEmployees, isEmpty, seedEmployees } from '../src/db/seed.js';
import { createEmployeeService } from '../src/employees/employee-service.js';
import { testDb } from './db.js';
import { fixedClock } from './fixtures.js';

describe('seed data', () => {
  const people = generateEmployees(300, 7);

  it('is deterministic for a given seed', () => {
    expect(generateEmployees(300, 7)).toEqual(people);
    expect(generateEmployees(300, 8)).not.toEqual(people);
  });

  it('produces employees that pass the same validation as user input', () => {
    for (const person of people) {
      expect(employeeInputSchema.safeParse(person).success, person.email).toBe(true);
    }
  });

  it('gives every employee a unique email', () => {
    expect(new Set(people.map((p) => p.email)).size).toBe(people.length);
  });

  it('keeps the current salary equal to the latest history entry, in date order', () => {
    for (const { annualSalary, history, joiningDate } of people) {
      expect(history[0].effectiveDate).toBe(joiningDate);
      expect(history.at(-1).annualSalary).toBe(annualSalary);
      expect(history.map((h) => h.effectiveDate)).toEqual(history.map((h) => h.effectiveDate).sort());
    }
  });

  it('inserts employees with their salary history', () => {
    const db = testDb();
    expect(isEmpty(db)).toBe(true);

    seedEmployees(db, { total: 50, seed: 1 });

    const service = createEmployeeService(db, fixedClock('2026-10-15'));
    const page = service.list({ page: 1, pageSize: 100, sortBy: 'fullName', sortDir: 'asc' });
    expect(page.total).toBe(50);
    const someone = page.items[0];
    expect(service.salaryHistory(someone.id)[0].annualSalary).toBe(someone.annualSalary);
  });
});
