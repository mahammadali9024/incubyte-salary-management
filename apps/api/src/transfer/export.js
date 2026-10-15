import ExcelJS from 'exceljs';
import { COUNTRIES, DEPARTMENTS, EMPLOYMENT_TYPES, JOB_TITLES } from '@acme/shared';
import { HEADERS, IMPORT_COLUMNS } from './columns.js';

/** Prefixes text that a spreadsheet would treat as a formula (CSV/formula injection). */
export function neutraliseFormula(value) {
  return typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function employeesSheet(workbook, columns) {
  const sheet = workbook.addWorksheet('Employees');
  sheet.columns = columns.map((c) => ({
    header: c.label,
    key: c.key,
    width: Math.max(14, c.label.length + 4),
  }));
  sheet.getRow(1).font = { bold: true };
  return sheet;
}

/**
 * Builds a csv or xlsx file from an iterable of employees.
 * @param {object[]} employees
 * @param {'csv' | 'xlsx'} format
 */
export async function buildExport(employees, format) {
  const workbook = new ExcelJS.Workbook();
  const sheet = employeesSheet(workbook, HEADERS);
  for (const employee of employees) {
    sheet.addRow(
      Object.fromEntries(HEADERS.map(({ key }) => [key, neutraliseFormula(employee[key])])),
    );
  }
  const buffer =
    format === 'csv' ? await workbook.csv.writeBuffer() : await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** An xlsx template with one example row and a sheet listing the allowed values. */
export async function buildImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  employeesSheet(workbook, IMPORT_COLUMNS).addRow({
    fullName: 'Asha Rao',
    email: 'asha.rao@acme.example',
    jobTitle: JOB_TITLES[0],
    department: DEPARTMENTS[0],
    country: COUNTRIES[0].name,
    employmentType: EMPLOYMENT_TYPES[0],
    joiningDate: '2024-04-01',
    annualSalary: 1800000,
  });

  const allowed = workbook.addWorksheet('Allowed values');
  const lists = {
    Country: COUNTRIES.map((c) => `${c.name} (${c.currency})`),
    Department: DEPARTMENTS,
    'Job Title': JOB_TITLES,
    'Employment Type': EMPLOYMENT_TYPES,
  };
  allowed.columns = Object.keys(lists).map((header) => ({ header, width: 28 }));
  allowed.getRow(1).font = { bold: true };
  const longest = Math.max(...Object.values(lists).map((l) => l.length));
  for (let i = 0; i < longest; i++) allowed.addRow(Object.values(lists).map((l) => l[i]));
  allowed.addRow([]);
  allowed.addRow([
    'Notes: Joining Date as YYYY-MM-DD. Annual Salary is gross, in the country currency.',
  ]);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
