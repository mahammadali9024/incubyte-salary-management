import express from 'express';
import { systemClock } from './clock.js';
import { createEmployeeService } from './employees/employee-service.js';
import { employeeRoutes } from './employees/employee-routes.js';
import { errorHandler } from './http/error-handler.js';
import { createInsightsService } from './insights/insights-service.js';
import { insightsRoutes } from './insights/insights-routes.js';

/**
 * Builds the Express app around an open database. Kept separate from server.js
 * so tests can drive it in-process against an in-memory database.
 *
 * @param {{ db: import('./db/client.js').Db, clock?: { today(): string } }} deps
 */
export function buildApp({ db, clock = systemClock }) {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/employees', employeeRoutes(createEmployeeService(db, clock)));
  app.use('/api/insights', insightsRoutes(createInsightsService(db)));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  app.use(errorHandler);

  return app;
}
