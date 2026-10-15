import ExcelJS from 'exceljs';
import { HEADERS } from '../../src/transfer/columns.js';

const IMPORT_HEADERS = HEADERS.filter((h) => !h.exportOnly).map((h) => h.label);

/** Rows as arrays in import-column order. */
export function row(overrides = {}) {
  const values = {
    'Full Name': 'Asha Rao',
    Email: 'asha@acme.test',
    'Job Title': 'Software Engineer',
    Department: 'Engineering',
    Country: 'India',
    'Employment Type': 'Full-time',
    'Joining Date': '2023-04-01',
    'Annual Salary': 1_800_000,
    ...overrides,
  };
  return IMPORT_HEADERS.map((h) => values[h]);
}

async function workbookWith(rows, headers) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');
  sheet.addRow(headers);
  rows.forEach((r) => sheet.addRow(r));
  return workbook;
}

export async function xlsxFile(rows, headers = IMPORT_HEADERS) {
  return Buffer.from(await (await workbookWith(rows, headers)).xlsx.writeBuffer());
}

export async function csvFile(rows, headers = IMPORT_HEADERS) {
  return Buffer.from(await (await workbookWith(rows, headers)).csv.writeBuffer());
}

export async function readXlsx(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}
