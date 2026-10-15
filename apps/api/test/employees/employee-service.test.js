import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from '../db.js';
import { anEmployee, fixedClock } from '../fixtures.js';
import { createEmployeeService } from '../../src/employees/employee-service.js';
import { ConflictError, NotFoundError } from '../../src/errors.js';

describe('EmployeeService', () => {
  let service;

  beforeEach(() => {
    service = createEmployeeService(testDb(), fixedClock('2026-10-15'));
  });

  describe('create', () => {
    it('stores the employee with the currency of their country', () => {
      const created = service.create(anEmployee({ country: 'Germany', annualSalary: 70_000 }));

      expect(created).toMatchObject({ id: expect.any(Number), country: 'Germany', currency: 'EUR' });
      expect(service.get(created.id)).toEqual(created);
    });

    it('records the starting salary as the first history entry, effective from the joining date', () => {
      const created = service.create(anEmployee({ joiningDate: '2024-01-15', annualSalary: 1_500_000 }));

      expect(service.salaryHistory(created.id)).toEqual([
        expect.objectContaining({ annualSalary: 1_500_000, currency: 'INR', effectiveDate: '2024-01-15' }),
      ]);
    });

    it('rejects a duplicate email', () => {
      service.create(anEmployee());

      expect(() => service.create(anEmployee({ fullName: 'Someone Else' }))).toThrow(ConflictError);
    });
  });

  describe('update', () => {
    it('updates details without touching salary history when pay is unchanged', () => {
      const created = service.create(anEmployee());

      const updated = service.update(created.id, { ...anEmployee(), jobTitle: 'Senior Software Engineer' });

      expect(updated.jobTitle).toBe('Senior Software Engineer');
      expect(service.salaryHistory(created.id)).toHaveLength(1);
    });

    it('appends a history entry when the salary changes, effective today by default', () => {
      const created = service.create(anEmployee({ annualSalary: 1_800_000 }));

      service.update(created.id, anEmployee({ annualSalary: 2_100_000 }));

      expect(service.get(created.id).annualSalary).toBe(2_100_000);
      expect(service.salaryHistory(created.id)[0]).toMatchObject({
        annualSalary: 2_100_000,
        effectiveDate: '2026-10-15',
      });
    });

    it('uses the supplied effective date for a salary change', () => {
      const created = service.create(anEmployee());

      service.update(created.id, { ...anEmployee({ annualSalary: 2_000_000 }), salaryEffectiveDate: '2026-11-01' });

      expect(service.salaryHistory(created.id)[0]?.effectiveDate).toBe('2026-11-01');
    });

    it('treats a move to a country with another currency as a salary change', () => {
      const created = service.create(anEmployee({ country: 'India', annualSalary: 1_800_000 }));

      const moved = service.update(created.id, anEmployee({ country: 'United Kingdom', annualSalary: 1_800_000 }));

      expect(moved.currency).toBe('GBP');
      expect(service.salaryHistory(created.id)[0]).toMatchObject({ currency: 'GBP' });
      expect(service.salaryHistory(created.id)).toHaveLength(2);
    });

    it('rejects taking another employee\'s email', () => {
      service.create(anEmployee({ email: 'taken@acme.test' }));
      const other = service.create(anEmployee({ email: 'other@acme.test' }));

      expect(() => service.update(other.id, anEmployee({ email: 'taken@acme.test' }))).toThrow(ConflictError);
    });

    it('fails for an unknown employee', () => {
      expect(() => service.update(999, anEmployee())).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('removes the employee and their salary history', () => {
      const created = service.create(anEmployee());

      service.delete(created.id);

      expect(() => service.get(created.id)).toThrow(NotFoundError);
      expect(service.salaryHistory(created.id)).toEqual([]);
    });

    it('fails for an unknown employee', () => {
      expect(() => service.delete(999)).toThrow(NotFoundError);
    });
  });

  describe('salaryHistory', () => {
    it('lists changes newest first', () => {
      const created = service.create(anEmployee({ joiningDate: '2022-01-01', annualSalary: 1_000_000 }));
      service.update(created.id, { ...anEmployee({ joiningDate: '2022-01-01', annualSalary: 1_200_000 }), salaryEffectiveDate: '2023-01-01' });
      service.update(created.id, { ...anEmployee({ joiningDate: '2022-01-01', annualSalary: 1_400_000 }), salaryEffectiveDate: '2024-01-01' });

      expect(service.salaryHistory(created.id).map((c) => c.annualSalary)).toEqual([1_400_000, 1_200_000, 1_000_000]);
    });
  });
});
