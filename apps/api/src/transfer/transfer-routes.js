import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { employeeFiltersSchema } from '@acme/shared';
import { ValidationError } from '../errors.js';
import { validate } from '../http/validate.js';
import { buildExport, buildImportTemplate } from './export.js';
import { readSpreadsheet } from './spreadsheet.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 20_000;
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_BYTES, files: 1 } });

const exportQuery = employeeFiltersSchema.extend({ format: z.enum(['csv', 'xlsx']).default('xlsx') });
const importQuery = z.object({ dryRun: z.enum(['true', 'false']).default('false') });

function formatOf(filename) {
  const extension = filename.toLowerCase().split('.').pop();
  if (extension === 'csv' || extension === 'xlsx') return extension;
  throw new ValidationError('Upload a .xlsx or .csv file');
}

function sendFile(res, buffer, filename, format) {
  res
    .type(format === 'csv' ? 'text/csv; charset=utf-8' : XLSX_TYPE)
    .attachment(filename)
    .send(buffer);
}

/**
 * @param {{ employeeRepository: object, importService: object, clock: { today(): string } }} deps
 */
export function transferRoutes({ employeeRepository, importService, clock }) {
  const router = Router();

  router.get('/export', async (req, res) => {
    const { format, ...filters } = validate(exportQuery, req.query);
    const buffer = await buildExport(employeeRepository.findAll(filters), format);
    sendFile(res, buffer, `employees-${clock.today()}.${format}`, format);
  });

  router.get('/import-template', async (_req, res) => {
    sendFile(res, await buildImportTemplate(), 'employee-import-template.xlsx', 'xlsx');
  });

  router.post('/import', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') return next(new ValidationError('File is larger than 5 MB'));
      next(err);
    });
  }, async (req, res) => {
    const { dryRun } = validate(importQuery, req.query);
    if (!req.file) throw new ValidationError('Attach a file in the "file" field');

    const rows = await readSpreadsheet(req.file.buffer, formatOf(req.file.originalname));
    if (rows.length > MAX_ROWS) throw new ValidationError(`Files are limited to ${MAX_ROWS} rows`);

    const report = importService.run(rows, { dryRun: dryRun === 'true' });
    res.status(report.errors.length > 0 ? 422 : 200).json(report);
  });

  return router;
}
