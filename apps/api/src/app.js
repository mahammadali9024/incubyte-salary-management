import express from 'express';

/** Builds the Express app. Kept separate from server.js so tests can drive it in-process. */
export function buildApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
