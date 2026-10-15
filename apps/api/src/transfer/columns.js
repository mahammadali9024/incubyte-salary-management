/** Spreadsheet columns, in export order. `exportOnly` columns are ignored on import. */
export const HEADERS = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'department', label: 'Department' },
  { key: 'country', label: 'Country' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'joiningDate', label: 'Joining Date' },
  { key: 'annualSalary', label: 'Annual Salary' },
  { key: 'currency', label: 'Currency', exportOnly: true },
  { key: 'annualSalaryUsd', label: 'Annual Salary (USD)', exportOnly: true },
];

export const IMPORT_COLUMNS = HEADERS.filter((h) => !h.exportOnly);

export const normaliseHeader = (header) => String(header ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
