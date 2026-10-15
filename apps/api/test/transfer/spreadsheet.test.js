import { describe, expect, it } from 'vitest';
import { readSpreadsheet } from '../../src/transfer/spreadsheet.js';
import { csvFile, row, xlsxFile } from './workbooks.js';

describe('readSpreadsheet', () => {
  it.each([
    ['xlsx', xlsxFile],
    ['csv', csvFile],
  ])('reads %s rows into employee fields with their sheet row numbers', async (format, make) => {
    const rows = await readSpreadsheet(await make([row()]), format);

    expect(rows).toEqual([
      {
        rowNumber: 2,
        values: {
          fullName: 'Asha Rao',
          email: 'asha@acme.test',
          jobTitle: 'Software Engineer',
          department: 'Engineering',
          country: 'India',
          employmentType: 'Full-time',
          joiningDate: '2023-04-01',
          annualSalary: 1_800_000,
        },
      },
    ]);
  });

  it('accepts real Excel dates and salaries typed with thousands separators', async () => {
    const file = await xlsxFile([
      row({ 'Joining Date': new Date(Date.UTC(2021, 6, 15)), 'Annual Salary': '1,250,000' }),
    ]);

    const [{ values }] = await readSpreadsheet(file, 'xlsx');

    expect(values).toMatchObject({ joiningDate: '2021-07-15', annualSalary: 1_250_000 });
  });

  it('matches headers regardless of case, spacing and column order', async () => {
    const headers = [
      'email',
      ' FULL NAME ',
      'Job Title',
      'Department',
      'Country',
      'Employment Type',
      'Joining Date',
      'Annual Salary',
    ];
    const file = await csvFile(
      [['x@acme.test', 'X Y', 'Designer', 'Design', 'Japan', 'Contract', '2020-01-01', 5_000_000]],
      headers,
    );

    const [{ values }] = await readSpreadsheet(file, 'csv');

    expect(values).toMatchObject({ email: 'x@acme.test', fullName: 'X Y', country: 'Japan' });
  });

  it('skips completely blank rows', async () => {
    const file = await xlsxFile([row(), [], row({ Email: 'b@acme.test' })]);

    expect((await readSpreadsheet(file, 'xlsx')).map((r) => r.rowNumber)).toEqual([2, 4]);
  });

  it('reports missing required columns', async () => {
    const file = await csvFile([['Asha']], ['Full Name']);

    await expect(readSpreadsheet(file, 'csv')).rejects.toThrow(/Missing columns: Email, Job Title/);
  });

  it('rejects a file that is not a spreadsheet', async () => {
    await expect(readSpreadsheet(Buffer.from('not a zip'), 'xlsx')).rejects.toThrow(
      /could not be read/i,
    );
  });
});
