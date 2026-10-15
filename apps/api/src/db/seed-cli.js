import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { openDb } from './client.js';
import { isEmpty, seedEmployees } from './seed.js';

// Usage: npm run seed            -> seeds only if the database is empty
//        npm run seed -- --reset -> deletes the database file and seeds from scratch
const dbPath = process.env.DATABASE_PATH ?? 'data/salary.db';
const reset = process.argv.includes('--reset');

mkdirSync(dirname(dbPath), { recursive: true });
if (reset) {
  for (const suffix of ['', '-wal', '-shm']) rmSync(`${dbPath}${suffix}`, { force: true });
}

const db = openDb(dbPath);
if (!isEmpty(db)) {
  console.log(`${dbPath} already has employees; use --reset to start over.`);
} else {
  const started = performance.now();
  const total = seedEmployees(db);
  console.log(`Seeded ${total} employees into ${dbPath} in ${Math.round(performance.now() - started)} ms`);
}
