/** A valid employee input; override only what a test cares about. */
export function anEmployee(overrides = {}) {
  return {
    fullName: 'Asha Rao',
    email: 'asha.rao@acme.test',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    country: 'India',
    employmentType: 'Full-time',
    joiningDate: '2023-04-01',
    annualSalary: 1_800_000,
    ...overrides,
  };
}

export const fixedClock = (today) => ({ today: () => today });
