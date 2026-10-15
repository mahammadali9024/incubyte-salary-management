import { Router } from 'express';
import { z } from 'zod';
import { registerSchema } from '@acme/shared';
import { validate } from '../http/validate.js';

const COOKIE = 'session';
const SESSION_HOURS = 8;

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

function readSession(req) {
  const raw = req.signedCookies?.[COOKIE];
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

/** Rejects requests without a valid, unexpired session cookie. */
export function requireAuth(req, res, next) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: 'Please log in' });
    return;
  }
  req.user = { email: session.email };
  next();
}

/**
 * @param {ReturnType<typeof import('./auth-service.js').createAuthService>} auth
 * @param {{ secureCookies: boolean }} options
 */
export function authRoutes(auth, { secureCookies }) {
  const router = Router();
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    signed: true,
    path: '/',
  };

  function startSession(res, user) {
    const maxAge = SESSION_HOURS * 60 * 60 * 1000;
    const session = { email: user.email, expiresAt: Date.now() + maxAge };
    res.cookie(COOKIE, JSON.stringify(session), { ...cookieOptions, maxAge });
  }

  router.post('/login', (req, res) => {
    const { email, password } = validate(loginSchema, req.body);
    const user = auth.verify(email, password);
    if (!user) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }
    startSession(res, user);
    res.json({ email: user.email });
  });

  // Open self-registration: anyone can create an HR profile (see docs/DECISIONS.md, 8).
  router.post('/register', (req, res) => {
    const { email, password } = validate(registerSchema, req.body);
    const user = auth.register(email, password);
    startSession(res, user);
    res.status(201).json({ email: user.email });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(COOKIE, cookieOptions);
    res.status(204).end();
  });

  router.get('/me', requireAuth, (req, res) => {
    res.json(req.user);
  });

  return router;
}
