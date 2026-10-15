import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The web app's build output, served by the API when present. */
const WEB_DIST = fileURLToPath(new URL('../../web/dist', import.meta.url));

/** Reads configuration from the environment, with safe local-development defaults. */
export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const sessionSecret = env.SESSION_SECRET ?? (production ? undefined : 'dev-only-secret');
  if (!sessionSecret) throw new Error('SESSION_SECRET must be set in production');

  return {
    port: Number(env.PORT ?? 3000),
    dbPath: env.DATABASE_PATH ?? 'data/salary.db',
    seedOnStart: env.SEED_ON_START === 'true',
    sessionSecret,
    secureCookies: production,
    staticDir: env.STATIC_DIR ?? (existsSync(WEB_DIST) ? WEB_DIST : undefined),
    hrEmail: env.HR_EMAIL ?? 'hr@acme.example',
    hrPassword: env.HR_PASSWORD ?? 'acme-hr-demo',
  };
}
