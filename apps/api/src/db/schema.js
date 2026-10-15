import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
};

export const employees = sqliteTable(
  'employees',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    fullName: text('full_name').notNull(),
    email: text('email').notNull().unique(),
    jobTitle: text('job_title').notNull(),
    department: text('department').notNull(),
    country: text('country').notNull(),
    currency: text('currency').notNull(),
    employmentType: text('employment_type').notNull(),
    joiningDate: text('joining_date').notNull(),
    /** Current gross annual salary in whole units of `currency`. */
    annualSalary: integer('annual_salary').notNull(),
    ...timestamps,
  },
  (t) => [
    index('employees_country_idx').on(t.country),
    index('employees_department_idx').on(t.department),
    index('employees_country_job_title_idx').on(t.country, t.jobTitle),
    index('employees_full_name_idx').on(t.fullName),
  ],
);

export const salaryChanges = sqliteTable(
  'salary_changes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    employeeId: integer('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    annualSalary: integer('annual_salary').notNull(),
    currency: text('currency').notNull(),
    effectiveDate: text('effective_date').notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index('salary_changes_employee_idx').on(t.employeeId, t.effectiveDate)],
);

export const hrUsers = sqliteTable('hr_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamps.createdAt,
});
