import { Readable } from 'node:stream';
import ExcelJS from 'exceljs';
import { ValidationError } from '../errors.js';
import { IMPORT_COLUMNS, normaliseHeader } from './columns.js';

async function loadSheet(buffer, format) {
  const workbook = new ExcelJS.Workbook();
  try {
    if (format === 'csv') {
      // Keep every CSV cell as text; type coercion happens in cellValue() below.
      return await workbook.csv.read(Readable.from(buffer), { map: (value) => value });
    }
    await workbook.xlsx.load(buffer);
    return workbook.worksheets[0];
  } catch {
    throw new ValidationError('The file could not be read as a spreadsheet');
  }
}

/** Flattens Excel cell values (dates, formulas, rich text, numbers) to plain values. */
function cellValue(value, key) {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('result' in value) return cellValue(value.result, key);
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return value.text;
  }
  if (key === 'annualSalary') {
    if (typeof value === 'number') return value;
    const digits = String(value).replace(/[,\s]/g, '');
    return digits === '' || Number.isNaN(Number(digits)) ? String(value) : Number(digits);
  }
  const text = String(value).trim();
  return text === '' ? undefined : text;
}

/**
 * Reads employee rows from an xlsx or csv file.
 * @param {Buffer} buffer
 * @param {'xlsx' | 'csv'} format
 * @returns {Promise<{ rowNumber: number, values: Record<string, unknown> }[]>}
 */
export async function readSpreadsheet(buffer, format) {
  const sheet = await loadSheet(buffer, format);
  if (!sheet || sheet.rowCount === 0) return [];

  const columnFor = new Map();
  sheet.getRow(1).eachCell((cell, column) => {
    const match = IMPORT_COLUMNS.find((c) => normaliseHeader(c.label) === normaliseHeader(cell.value));
    if (match) columnFor.set(match.key, column);
  });
  const missing = IMPORT_COLUMNS.filter((c) => !columnFor.has(c.key)).map((c) => c.label);
  if (missing.length > 0) {
    throw new ValidationError(`Missing columns: ${missing.join(', ')}`);
  }

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = {};
    for (const [key, column] of columnFor) {
      const value = cellValue(row.getCell(column).value, key);
      if (value !== undefined) values[key] = value;
    }
    if (Object.keys(values).length > 0) rows.push({ rowNumber, values });
  });
  return rows;
}
