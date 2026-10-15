import { describe, expect, it } from 'vitest';
import { employeeInputSchema } from '../src/employee.js';

const valid = {
  fullName: 'Asha Rao',
  email: 'asha.rao@acme.test',
  jobTitle: 'Software Engineer',
  department: 'Engineering',
  country: 'India',
  employmentType: 'Full-time',
  joiningDate: '2023-04-01',
  annualSalary: 1_800_000,
};

describe('employeeInputSchema', () => {
  it('accepts a valid employee', () => {
    expect(employeeInputSchema.parse(valid)).toEqual(valid);
  });

  it('normalises email case and surrounding whitespace', () => {
    const parsed = employeeInputSchema.parse({ ...valid, email: '  Asha.Rao@ACME.test ' });
    expect(parsed.email).toBe('asha.rao@acme.test');
  });

  it.each([
    ['a blank name', { fullName: '   ' }],
    ['an invalid email', { email: 'not-an-email' }],
    ['an unknown country', { country: 'Atlantis' }],
    ['a non-ISO joining date', { joiningDate: '01/04/2023' }],
    ['a fractional salary', { annualSalary: 1000.5 }],
    ['a zero salary', { annualSalary: 0 }],
    ['a negative salary', { annualSalary: -5 }],
  ])('rejects %s', (_label, override) => {
    expect(employeeInputSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
