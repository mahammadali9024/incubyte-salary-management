import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';
import { createAuthService } from './auth/auth-service.js';
import { loadConfig } from './config.js';
import { openDb } from './db/client.js';
import { isEmpty, seedEmployees } from './db/seed.js';

const config = loadConfig();

mkdirSync(dirname(config.dbPath), { recursive: true });
const db = openDb(config.dbPath);

// On ephemeral hosting (Render free tier) the database starts empty after each deploy.
if (config.seedOnStart && isEmpty(db)) {
  console.log(`Seeded ${seedEmployees(db)} employees`);
}
createAuthService(db).ensureUser(config.hrEmail, config.hrPassword);

const app = buildApp({ db, sessionSecret: config.sessionSecret, secureCookies: config.secureCookies });
app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (db: ${config.dbPath})`);
});
