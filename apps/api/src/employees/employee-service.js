import { currencyFor } from '@acme/shared';
import { ConflictError, NotFoundError } from '../errors.js';
import { createEmployeeRepository } from './employee-repository.js';

/**
 * Business rules for employee records and their salary history.
 * Inputs are expected to be validated already (see the shared Zod schemas).
 *
 * @param {import('../db/client.js').Db} db
 * @param {{ today(): string }} clock
 */
export function createEmployeeService(db, clock) {
  const repo = createEmployeeRepository(db);

  function requireEmployee(id) {
    const employee = repo.findById(id);
    if (!employee) throw new NotFoundError(`Employee ${id} not found`);
    return employee;
  }

  function assertEmailAvailable(email, exceptId) {
    const owner = repo.findByEmail(email);
    if (owner && owner.id !== exceptId) {
      throw new ConflictError(`An employee with email ${email} already exists`);
    }
  }

  return {
    get: requireEmployee,

    list(query) {
      return { ...repo.list(query), page: query.page, pageSize: query.pageSize };
    },

    create(input) {
      return db.transaction(() => {
        assertEmailAvailable(input.email);
        const currency = currencyFor(input.country);
        const employee = repo.insert({ ...input, currency });
        repo.addSalaryChange({
          employeeId: employee.id,
          annualSalary: input.annualSalary,
          currency,
          effectiveDate: input.joiningDate,
        });
        return employee;
      });
    },

    /**
     * Updates an employee. A different salary, or a move to a country with another
     * currency, is recorded in the salary history.
     */
    update(id, input) {
      return db.transaction(() => {
        const current = requireEmployee(id);
        assertEmailAvailable(input.email, id);
        const { salaryEffectiveDate, ...fields } = input;
        const currency = currencyFor(fields.country);
        const updated = repo.update(id, { ...fields, currency });

        const payChanged =
          fields.annualSalary !== current.annualSalary || currency !== current.currency;
        if (payChanged) {
          repo.addSalaryChange({
            employeeId: id,
            annualSalary: fields.annualSalary,
            currency,
            effectiveDate: salaryEffectiveDate ?? clock.today(),
          });
        }
        return updated;
      });
    },

    delete(id) {
      if (!repo.delete(id)) throw new NotFoundError(`Employee ${id} not found`);
    },

    salaryHistory(id) {
      return repo.salaryHistory(id);
    },
  };
}
