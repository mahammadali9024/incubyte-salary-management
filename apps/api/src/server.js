import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';
import { openDb } from './db/client.js';
import { isEmpty, seedEmployees } from './db/seed.js';

const port = Number(process.env.PORT ?? 3000);
const dbPath = process.env.DATABASE_PATH ?? 'data/salary.db';

mkdirSync(dirname(dbPath), { recursive: true });
const db = openDb(dbPath);

// On ephemeral hosting (Render free tier) the database starts empty after each deploy.
if (process.env.SEED_ON_START === 'true' && isEmpty(db)) {
  console.log(`Seeded ${seedEmployees(db)} employees`);
}

buildApp({ db }).listen(port, () => {
  console.log(`API listening on http://localhost:${port} (db: ${dbPath})`);
});
