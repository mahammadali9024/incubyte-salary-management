import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { TEST_USER, testApp } from '../http.js';

describe('authentication', () => {
  it('logs in with valid credentials and sets an httpOnly session cookie', async () => {
    const res = await request(testApp().app).post('/api/auth/login').send(TEST_USER);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: TEST_USER.email });
    expect(res.headers['set-cookie'][0]).toMatch(/session=.*HttpOnly/);
  });

  it('accepts the email in any letter case', async () => {
    const res = await request(testApp().app)
      .post('/api/auth/login')
      .send({ ...TEST_USER, email: TEST_USER.email.toUpperCase() });

    expect(res.status).toBe(200);
  });

  it.each([
    ['a wrong password', { ...TEST_USER, password: 'nope' }],
    ['an unknown email', { ...TEST_USER, email: 'who@acme.test' }],
  ])('rejects %s with the same message', async (_label, credentials) => {
    const res = await request(testApp().app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Incorrect email or password');
  });

  it.each(['/api/employees', '/api/insights/overview', '/api/auth/me'])(
    'protects %s from anonymous requests',
    async (path) => {
      expect((await request(testApp().app).get(path)).status).toBe(401);
    },
  );

  it('rejects a tampered session cookie', async () => {
    const forged = encodeURIComponent(JSON.stringify({ email: 'x', expiresAt: Date.now() + 1e9 }));
    const res = await request(testApp().app)
      .get('/api/auth/me')
      .set('Cookie', `session=s:${forged}.bad`);

    expect(res.status).toBe(401);
  });

  it('keeps the session across requests and ends it on logout', async () => {
    const agent = request.agent(testApp().app);
    await agent.post('/api/auth/login').send(TEST_USER);

    expect((await agent.get('/api/auth/me')).body).toEqual({ email: TEST_USER.email });

    await agent.post('/api/auth/logout').expect(204);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('configuration', () => {
  it('refuses to start in production without a session secret', async () => {
    const { loadConfig } = await import('../../src/config.js');

    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/SESSION_SECRET/);
  });
});

describe('creating an HR profile', () => {
  const profile = { email: 'New.Person@ACME.test', password: 'long enough pw' };

  it('creates the profile and signs the new user in', async () => {
    const agent = request.agent(testApp().app);

    const res = await agent.post('/api/auth/register').send(profile);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ email: 'new.person@acme.test' });
    expect((await agent.get('/api/auth/me')).body).toEqual({ email: 'new.person@acme.test' });
  });

  it('lets the new user log in later with their password', async () => {
    const { app } = testApp();
    await request(app).post('/api/auth/register').send(profile);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'new.person@acme.test', password: profile.password });

    expect(res.status).toBe(200);
  });

  it('rejects an email that already has a profile, without changing its password', async () => {
    const { app } = testApp();

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...TEST_USER, password: 'attacker-chosen' });

    expect(res.status).toBe(409);
    expect((await request(app).post('/api/auth/login').send(TEST_USER)).status).toBe(200);
  });

  it('rejects a short password and an invalid email with field messages', async () => {
    const res = await request(testApp().app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.details).toMatchObject({
      email: ['Enter a valid email'],
      password: ['Use at least 8 characters'],
    });
  });
});
