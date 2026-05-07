import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { eq } from 'drizzle-orm';
import type { getDb } from '../db/connection.js';
import { users } from '../db/schema/index.js';
import { env } from '../env.js';
import { findOrCreateUser } from './userService.js';

type Db = ReturnType<typeof getDb>;

export function registerStrategies(db: Db): void {
  passport.serializeUser((user, done) => {
    done(null, (user as Express.User).id);
  });

  passport.deserializeUser((id: number, done) => {
    try {
      const [user] = db.select().from(users).where(eq(users.id, id)).all();
      done(null, user ?? null);
    } catch (err) {
      done(err);
    }
  });

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${env.BASE_URL}/api/auth/google/callback`,
        },
        (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = findOrCreateUser(db, {
              provider: 'google',
              providerUserId: profile.id,
              email: profile.emails?.[0]?.value ?? '',
              displayName: profile.displayName,
              avatarUrl: profile.photos?.[0]?.value ?? null,
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        },
      ),
    );
  }

  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
          callbackURL: `${env.BASE_URL}/api/auth/github/callback`,
        },
        (
          _accessToken: string,
          _refreshToken: string,
          profile: { id: string; displayName?: string; username?: string; emails?: { value: string }[]; photos?: { value: string }[] },
          done: (err: Error | null, user?: Express.User) => void,
        ) => {
          try {
            const user = findOrCreateUser(db, {
              provider: 'github',
              providerUserId: String(profile.id),
              email: profile.emails?.[0]?.value ?? '',
              displayName: profile.displayName ?? profile.username ?? '',
              avatarUrl: profile.photos?.[0]?.value ?? null,
            });
            done(null, user);
          } catch (err) {
            done(err as Error);
          }
        },
      ),
    );
  }
}
