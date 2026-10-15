import { z } from 'zod';
import { COUNTRY_NAMES, DEPARTMENTS, EMPLOYMENT_TYPES, JOB_TITLES } from './reference-data.js';

/** Upper bound guards against typos like an extra zero; covers JPY/INR magnitudes. */
export const MAX_ANNUAL_SALARY = 1_000_000_000;

const trimmed = z.string().trim();
const isoDate = z.iso.date('Use YYYY-MM-DD');

export const employeeInputSchema = z.object({
  fullName: trimmed.min(1, 'Full name is required').max(120),
  email: trimmed.toLowerCase().pipe(z.email('Enter a valid email')),
  jobTitle: z.enum(JOB_TITLES, 'Choose a job title from the list'),
  department: z.enum(DEPARTMENTS, 'Choose a department from the list'),
  country: z.enum(COUNTRY_NAMES, `Country must be one of: ${COUNTRY_NAMES.join(', ')}`),
  employmentType: z.enum(EMPLOYMENT_TYPES, `Use ${EMPLOYMENT_TYPES.join(', ')}`),
  joiningDate: isoDate,
  annualSalary: z
    .number('Salary must be a number')
    .int('Salary must be a whole number')
    .positive('Salary must be greater than zero')
    .max(MAX_ANNUAL_SALARY, 'Salary looks too large'),
});

export const employeeUpdateSchema = employeeInputSchema.extend({
  /** When the salary (or currency) changes, the date the new salary takes effect. Defaults to today. */
  salaryEffectiveDate: isoDate.optional(),
});

export const SORTABLE_FIELDS = ['fullName', 'joiningDate', 'annualSalary', 'country'];

export const employeeFiltersSchema = z.object({
  search: trimmed.max(120).optional(),
  country: z.enum(COUNTRY_NAMES).optional(),
  department: z.enum(DEPARTMENTS).optional(),
  jobTitle: z.enum(JOB_TITLES).optional(),
  sortBy: z.enum(SORTABLE_FIELDS).default('fullName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export const employeeListQuerySchema = employeeFiltersSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
