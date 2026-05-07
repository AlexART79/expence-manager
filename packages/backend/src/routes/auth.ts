import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import { findOrCreateUser } from '../auth/userService.js';
import type { getDb } from '../db/connection.js';
import { env } from '../env.js';

type Db = ReturnType<typeof getDb>;

const TestLoginSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
});

export function createAuthRouter(db: Db): Router {
  const router = Router();

  router.get('/me', (req, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} },
      });
    }
    const { id, email, displayName, avatarUrl, provider } = req.user as Express.User;
    return res.json({ id, email, displayName, avatarUrl, provider });
  });

  router.post('/logout', (req, res, next) => {
    req.logOut((err) => {
      if (err) return next(err);
      res.json({ ok: true });
    });
  });

  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${env.FRONTEND_URL}/login?error=auth_failed`,
    }),
    (_req, res) => res.redirect(env.FRONTEND_URL),
  );

  router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

  router.get(
    '/github/callback',
    passport.authenticate('github', {
      failureRedirect: `${env.FRONTEND_URL}/login?error=auth_failed`,
    }),
    (_req, res) => res.redirect(env.FRONTEND_URL),
  );

  // Test-only stub — bypasses real OAuth for automated tests
  if (env.NODE_ENV === 'test') {
    router.post(
      '/test/login',
      validateRequest({ body: TestLoginSchema }),
      (req, res, next) => {
        const user = findOrCreateUser(db, {
          provider: 'test',
          providerUserId: `test-${req.body.email}`,
          email: req.body.email,
          displayName: req.body.displayName,
        });
        req.logIn(user, (err) => {
          if (err) return next(err);
          const { id, email, displayName, avatarUrl } = user;
          res.json({ id, email, displayName, avatarUrl });
        });
      },
    );
  }

  return router;
}
