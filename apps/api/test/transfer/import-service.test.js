import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from '../db.js';
import { anEmployee, fixedClock } from '../fixtures.js';
import { createEmployeeService } from '../../src/employees/employee-service.js';
import { createImportService } from '../../src/transfer/import-service.js';

const parsed = (rows) => rows.map((values, i) => ({ rowNumber: i + 2, values }));

describe('ImportService', () => {
  let employees;
  let importer;

  beforeEach(() => {
    const db = testDb();
    employees = createEmployeeService(db, fixedClock('2026-10-15'));
    importer = createImportService(db, employees);
    employees.create(anEmployee({ email: 'existing@acme.test', annualSalary: 1_000_000 }));
  });

  const total = () =>
    employees.list({ page: 1, pageSize: 1, sortBy: 'fullName', sortDir: 'asc' }).total;

  it('previews creates and updates without changing anything on a dry run', () => {
    const report = importer.run(
      parsed([
        anEmployee({ email: 'new@acme.test' }),
        anEmployee({ email: 'existing@acme.test', annualSalary: 1_100_000 }),
      ]),
      { dryRun: true },
    );

    expect(report).toEqual({
      committed: false,
      rows: 2,
      created: 1,
      updated: 1,
      unchanged: 0,
      errors: [],
    });
    expect(total()).toBe(1);
  });

  it('creates new employees and updates existing ones matched by email', () => {
    const report = importer.run(
      parsed([
        anEmployee({ email: 'new@acme.test' }),
        anEmployee({ email: 'EXISTING@acme.test', annualSalary: 1_100_000 }),
      ]),
    );

    expect(report).toMatchObject({ committed: true, created: 1, updated: 1 });
    expect(total()).toBe(2);
  });

  it('records imported salary changes in the history', () => {
    importer.run(parsed([anEmployee({ email: 'existing@acme.test', annualSalary: 1_100_000 })]));

    const [existing] = employees.list({
      page: 1,
      pageSize: 1,
      search: 'existing',
      sortBy: 'fullName',
      sortDir: 'asc',
    }).items;
    expect(employees.salaryHistory(existing.id)[0]).toMatchObject({
      annualSalary: 1_100_000,
      effectiveDate: '2026-10-15',
    });
  });

  it('counts rows identical to the stored employee as unchanged', () => {
    const report = importer.run(
      parsed([anEmployee({ email: 'existing@acme.test', annualSalary: 1_000_000 })]),
    );

    expect(report).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
  });

  it('reports every invalid row with its sheet row number and imports nothing', () => {
    const report = importer.run(
      parsed([
        anEmployee({ email: 'ok@acme.test' }),
        anEmployee({ email: 'bad-email', annualSalary: -5 }),
        anEmployee({ email: 'x@acme.test', country: 'Atlantis' }),
      ]),
    );

    expect(report.committed).toBe(false);
    expect(report.errors).toEqual([
      { row: 3, field: 'email', message: 'Enter a valid email' },
      { row: 3, field: 'annualSalary', message: 'Salary must be greater than zero' },
      { row: 4, field: 'country', message: expect.any(String) },
    ]);
    expect(total()).toBe(1);
  });

  it('flags an email that appears twice in the file', () => {
    const report = importer.run(
      parsed([anEmployee({ email: 'dup@acme.test' }), anEmployee({ email: 'DUP@acme.test' })]),
    );

    expect(report.errors).toEqual([{ row: 3, field: 'email', message: 'Duplicate of row 2' }]);
  });

  it('rejects an empty file', () => {
    expect(importer.run([]).errors).toEqual([
      { row: null, field: null, message: 'The file has no employee rows' },
    ]);
  });
});
