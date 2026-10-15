import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { testDb } from './db.js';

describe('serving the web app', () => {
  const staticDir = mkdtempSync(join(tmpdir(), 'web-'));
  writeFileSync(join(staticDir, 'index.html'), '<div id="root"></div>');
  writeFileSync(join(staticDir, 'app.js'), 'console.log(1)');
  const api = request(buildApp({ db: testDb(), sessionSecret: 's', staticDir }));

  it('serves built assets', async () => {
    const res = await api.get('/app.js');
    expect(res.status).toBe(200);
  });

  it('serves the app shell for client-side routes', async () => {
    const res = await api.get('/insights');
    expect(res.status).toBe(200);
    expect(res.text).toContain('id="root"');
  });

  it('still answers unknown API paths with JSON 404', async () => {
    const res = await api.get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
