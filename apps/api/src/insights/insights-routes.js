import { Router } from 'express';
import { z } from 'zod';
import { COUNTRY_NAMES } from '@acme/shared';
import { validate } from '../http/validate.js';

const countryQuery = z.object({ country: z.enum(COUNTRY_NAMES) });
const distributionQuery = countryQuery.extend({
  bins: z.coerce.number().int().min(2).max(50).default(10),
});

/** @param {ReturnType<typeof import('./insights-service.js').createInsightsService>} insights */
export function insightsRoutes(insights) {
  const router = Router();

  router.get('/overview', (_req, res) => res.json(insights.overview()));
  router.get('/by-country', (_req, res) => res.json(insights.byCountry()));
  router.get('/by-department', (_req, res) => res.json(insights.byDepartment()));

  router.get('/by-job-title', (req, res) => {
    const { country } = validate(countryQuery, req.query);
    res.json(insights.byJobTitle(country));
  });

  router.get('/distribution', (req, res) => {
    const { country, bins } = validate(distributionQuery, req.query);
    res.json(insights.distribution(country, bins));
  });

  return router;
}
