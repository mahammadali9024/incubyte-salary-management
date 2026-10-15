import { beforeEach, describe, expect, it } from 'vitest';
import { anEmployee } from '../fixtures.js';
import { loggedInApi } from '../http.js';
import { csvFile, readXlsx, row, xlsxFile } from './workbooks.js';

describe('import and export endpoints', () => {
  let api;

  beforeEach(async () => {
    api = await loggedInApi();
    await api
      .post('/api/employees')
      .send(anEmployee({ email: 'india@acme.test', country: 'India' }));
    await api
      .post('/api/employees')
      .send(anEmployee({ email: 'japan@acme.test', country: 'Japan', annualSalary: 6_000_000 }));
  });

  const upload = async (buffer, filename, query = {}) =>
    api.post('/api/employees/import').query(query).attach('file', buffer, filename);

  it('previews an xlsx import on a dry run', async () => {
    const res = await upload(await xlsxFile([row({ Email: 'new@acme.test' })]), 'staff.xlsx', {
      dryRun: 'true',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ committed: false, created: 1 });
  });

  it('commits a valid csv import', async () => {
    const res = await upload(await csvFile([row({ Email: 'new@acme.test' })]), 'staff.csv');

    expect(res.body).toMatchObject({ committed: true, created: 1 });
    expect((await api.get('/api/employees')).body.total).toBe(3);
  });

  it('answers 422 with the row errors when the file has invalid rows', async () => {
    const res = await upload(await csvFile([row({ Email: 'nope' })]), 'staff.csv');

    expect(res.status).toBe(422);
    expect(res.body.errors[0]).toMatchObject({ row: 2, field: 'email' });
  });

  it('rejects unsupported file types and missing files', async () => {
    expect((await upload(Buffer.from('hi'), 'notes.txt')).status).toBe(400);
    expect((await api.post('/api/employees/import')).status).toBe(400);
  });

  it('exports the filtered list as xlsx with USD and currency columns', async () => {
    const res = await api
      .get('/api/employees/export')
      .query({ format: 'xlsx', country: 'Japan' })
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="employees-.*\.xlsx"/);
    const sheet = (await readXlsx(res.body)).getWorksheet('Employees');
    expect(sheet.rowCount).toBe(2);
    expect(sheet.getRow(1).values).toEqual(
      expect.arrayContaining(['Email', 'Currency', 'Annual Salary (USD)']),
    );
    expect(sheet.getRow(2).values).toEqual(
      expect.arrayContaining(['japan@acme.test', 'JPY', 6_000_000, 40_200]),
    );
  });

  it('exports csv that can be imported back unchanged', async () => {
    const exported = await api.get('/api/employees/export').query({ format: 'csv' });

    expect(exported.headers['content-type']).toMatch(/text\/csv/);
    const res = await upload(Buffer.from(exported.text), 'roundtrip.csv', { dryRun: 'true' });
    expect(res.body).toMatchObject({ rows: 2, created: 0, updated: 0, unchanged: 2, errors: [] });
  });

  it('neutralises spreadsheet formulas in exported text', async () => {
    await api
      .post('/api/employees')
      .send(anEmployee({ email: 'evil@acme.test', fullName: '=HYPERLINK("http://x")' }));

    const exported = await api
      .get('/api/employees/export')
      .query({ format: 'csv', search: 'evil' });

    expect(exported.text).toContain(`'=HYPERLINK`);
  });

  it('serves an import template with an allowed-values sheet', async () => {
    const res = await api
      .get('/api/employees/import-template')
      .buffer(true)
      .parse((r, cb) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });

    const workbook = await readXlsx(res.body);
    expect(workbook.getWorksheet('Employees')).toBeDefined();
    expect(workbook.getWorksheet('Allowed values')).toBeDefined();
  });
});
