import { employeeInputSchema } from '@acme/shared';
import { createEmployeeRepository } from '../employees/employee-repository.js';

const COMPARED_FIELDS = employeeInputSchema.keyof().options;

class RollbackDryRun extends Error {}

/**
 * Validates every row first, then applies all of them in one transaction —
 * a file with any invalid row changes nothing.
 *
 * @param {import('../db/client.js').Db} db
 * @param {ReturnType<typeof import('../employees/employee-service.js').createEmployeeService>} employees
 */
export function createImportService(db, employees) {
  const repo = createEmployeeRepository(db);

  function validateRows(rows) {
    const errors = [];
    const valid = [];
    const firstRowForEmail = new Map();

    for (const { rowNumber, values } of rows) {
      const result = employeeInputSchema.safeParse(values);
      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            row: rowNumber,
            field: String(issue.path[0] ?? ''),
            message: issue.message,
          });
        }
        continue;
      }
      const seenAt = firstRowForEmail.get(result.data.email);
      if (seenAt) {
        errors.push({ row: rowNumber, field: 'email', message: `Duplicate of row ${seenAt}` });
        continue;
      }
      firstRowForEmail.set(result.data.email, rowNumber);
      valid.push(result.data);
    }
    return { valid, errors };
  }

  const isUnchanged = (current, input) =>
    COMPARED_FIELDS.every((field) => current[field] === input[field]);

  return {
    /**
     * @param {{ rowNumber: number, values: object }[]} rows
     * @param {{ dryRun?: boolean }} [options]
     */
    run(rows, { dryRun = false } = {}) {
      const report = {
        committed: false,
        rows: rows.length,
        created: 0,
        updated: 0,
        unchanged: 0,
        errors: [],
      };
      if (rows.length === 0) {
        report.errors.push({ row: null, field: null, message: 'The file has no employee rows' });
        return report;
      }

      const { valid, errors } = validateRows(rows);
      if (errors.length > 0) return { ...report, errors };

      try {
        db.transaction(() => {
          for (const input of valid) {
            const current = repo.findByEmail(input.email);
            if (!current) {
              employees.create(input);
              report.created += 1;
            } else if (isUnchanged(current, input)) {
              report.unchanged += 1;
            } else {
              employees.update(current.id, input);
              report.updated += 1;
            }
          }
          // A dry run exercises the exact same path, then rolls it back.
          if (dryRun) throw new RollbackDryRun();
        });
      } catch (err) {
        if (!(err instanceof RollbackDryRun)) throw err;
      }
      return { ...report, committed: !dryRun };
    },
  };
}
