import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm';
import { toUsd } from '@acme/shared';
import { employees, salaryChanges } from '../db/schema.js';
import { salaryInUsd } from './usd-sql.js';

/** Adds the USD equivalent so every consumer can compare across currencies. */
export function toEmployee(row) {
  return { ...row, annualSalaryUsd: toUsd(row.annualSalary, row.currency) };
}

function escapeLike(term) {
  return term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

function filtersFor({ country, department, jobTitle, search }) {
  const conditions = [
    country && eq(employees.country, country),
    department && eq(employees.department, department),
    jobTitle && eq(employees.jobTitle, jobTitle),
  ];
  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    conditions.push(
      or(
        sql`${employees.fullName} like ${pattern} escape '\\'`,
        sql`${employees.email} like ${pattern} escape '\\'`,
      ),
    );
  }
  return and(...conditions.filter(Boolean));
}

const sortColumns = {
  fullName: employees.fullName,
  joiningDate: employees.joiningDate,
  country: employees.country,
  annualSalary: salaryInUsd(),
};

function orderFor({ sortBy, sortDir }) {
  const direction = sortDir === 'desc' ? desc : asc;
  return [direction(sortColumns[sortBy]), asc(employees.id)];
}

/** @param {import('../db/client.js').Db} db */
export function createEmployeeRepository(db) {
  return {
    findById(id) {
      const row = db.select().from(employees).where(eq(employees.id, id)).get();
      return row && toEmployee(row);
    },

    findByEmail(email) {
      const row = db.select().from(employees).where(eq(employees.email, email)).get();
      return row && toEmployee(row);
    },

    insert(values) {
      return toEmployee(db.insert(employees).values(values).returning().get());
    },

    update(id, values) {
      const row = db
        .update(employees)
        .set({ ...values, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
        .where(eq(employees.id, id))
        .returning()
        .get();
      return toEmployee(row);
    },

    delete(id) {
      return db.delete(employees).where(eq(employees.id, id)).run().changes > 0;
    },

    list(query) {
      const where = filtersFor(query);
      const rows = db
        .select()
        .from(employees)
        .where(where)
        .orderBy(...orderFor(query))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize)
        .all();
      const total = db.select({ n: count() }).from(employees).where(where).get().n;
      return { items: rows.map(toEmployee), total };
    },

    /** Every employee matching the filters, unpaged — used for export (≈10k rows). */
    findAll(filters) {
      return db
        .select()
        .from(employees)
        .where(filtersFor(filters))
        .orderBy(...orderFor(filters))
        .all()
        .map(toEmployee);
    },

    addSalaryChange(change) {
      db.insert(salaryChanges).values(change).run();
    },

    salaryHistory(employeeId) {
      return db
        .select()
        .from(salaryChanges)
        .where(eq(salaryChanges.employeeId, employeeId))
        .orderBy(desc(salaryChanges.effectiveDate), desc(salaryChanges.id))
        .all();
    },
  };
}
