import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthService } from '../src/auth/auth-service.js';
import { testDb } from './db.js';

export const TEST_USER = { email: 'hr@acme.test', password: 'correct horse' };
const BCRYPT_ROUNDS = 4; // fast hashing keeps tests quick

/** An app on a fresh in-memory database with the test HR user, and an unauthenticated client. */
export function testApp({ clock, db = testDb() } = {}) {
  createAuthService(db, { bcryptRounds: BCRYPT_ROUNDS }).ensureUser(
    TEST_USER.email,
    TEST_USER.password,
  );
  const app = buildApp({ db, clock, sessionSecret: 'test-secret', bcryptRounds: BCRYPT_ROUNDS });
  return { app, db };
}

/** A supertest agent that is already logged in (cookies persist across requests). */
export async function loggedInApi(options) {
  const agent = request.agent(testApp(options).app);
  await agent.post('/api/auth/login').send(TEST_USER).expect(200);
  return agent;
}
