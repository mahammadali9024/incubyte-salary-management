import express from 'express';
import cookieParser from 'cookie-parser';
import { systemClock } from './clock.js';
import { createAuthService } from './auth/auth-service.js';
import { authRoutes, requireAuth } from './auth/auth-routes.js';
import { createEmployeeService } from './employees/employee-service.js';
import { employeeRoutes } from './employees/employee-routes.js';
import { errorHandler } from './http/error-handler.js';
import { createInsightsService } from './insights/insights-service.js';
import { insightsRoutes } from './insights/insights-routes.js';

/**
 * Builds the Express app around an open database. Kept separate from server.js
 * so tests can drive it in-process against an in-memory database.
 *
 * @param {object} deps
 * @param {import('./db/client.js').Db} deps.db
 * @param {string} deps.sessionSecret signs the session cookie
 * @param {{ today(): string }} [deps.clock]
 * @param {boolean} [deps.secureCookies] true in production (HTTPS)
 * @param {number} [deps.bcryptRounds]
 */
export function buildApp({ db, sessionSecret, clock = systemClock, secureCookies = false, bcryptRounds }) {
  if (!sessionSecret) throw new Error('sessionSecret is required');

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(sessionSecret));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes(createAuthService(db, { bcryptRounds }), { secureCookies }));
  app.use('/api/employees', requireAuth, employeeRoutes(createEmployeeService(db, clock)));
  app.use('/api/insights', requireAuth, insightsRoutes(createInsightsService(db)));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
