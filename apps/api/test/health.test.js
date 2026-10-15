import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

describe('GET /api/health', () => {
  it('reports the service is up', async () => {
    const res = await request(buildApp()).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
