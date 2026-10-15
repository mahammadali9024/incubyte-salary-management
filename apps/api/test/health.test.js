import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { testApp } from './http.js';

describe('GET /api/health', () => {
  it('reports the service is up without requiring login', async () => {
    const res = await request(testApp().app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
