import { Router } from "express";
import type { AppEnv } from "../env.js";
import { ApiError } from "../errors.js";
import type { DatabaseHandle } from "../db/connection.js";
import { buildProviderStartUrl, exchangeProviderCode, providerSchema } from "./providers.js";
import { requireAuth, resolveCurrentUser } from "./requireAuth.js";
import { clearSessionCookie, createSession, expireSession, readSessionToken, setSessionCookie } from "./session.js";
import { upsertUserFromProvider } from "./users.js";

export function createAuthRouter(database: DatabaseHandle, env: AppEnv) {
  const router = Router();

  router.get("/auth/:provider/start", (req, res, next) => {
    const provider = parseProvider(req.params.provider, next);
    if (!provider) {
      return;
    }

    res.redirect(buildProviderStartUrl(provider, env));
  });

  router.get("/auth/:provider/callback", async (req, res, next) => {
    try {
      const provider = parseProvider(req.params.provider, next);
      if (!provider) {
        return;
      }

      const code = typeof req.query.code === "string" ? req.query.code : null;
      if (!code) {
        throw new ApiError(400, "VALIDATION_ERROR", "Missing auth callback code");
      }

      const providerUser = await exchangeProviderCode(provider, code, env);
      const user = upsertUserFromProvider(database.db, providerUser);
      const session = createSession(database.db, user.id, env);
      setSessionCookie(res, session.token, session.expiresAt, env);
      res.redirect(env.frontendUrl);
    } catch (error) {
      next(error);
    }
  });

  router.get("/auth/me", (req, res, next) => {
    const user = resolveCurrentUser(req, database, env);
    if (!user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }

    res.json({ user });
  });

  router.post("/auth/logout", requireAuth(database, env), (req, res) => {
    expireSession(database.db, readSessionToken(req.headers.cookie), env);
    clearSessionCookie(res, env);
    res.status(204).send();
  });

  return router;
}

function parseProvider(provider: string | undefined, next: (error: unknown) => void) {
  const result = providerSchema.safeParse(provider);
  if (!result.success) {
    next(new ApiError(400, "VALIDATION_ERROR", "Unsupported auth provider", { provider }));
    return null;
  }

  return result.data;
}
