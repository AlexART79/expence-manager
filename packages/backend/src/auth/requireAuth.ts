import type { NextFunction, Request, Response } from "express";
import type { AppEnv } from "../env.js";
import { ApiError } from "../errors.js";
import type { DatabaseHandle } from "../db/connection.js";
import { getCurrentUserFromToken, readSessionToken } from "./session.js";
import type { CurrentUser } from "./types.js";

declare module "express-serve-static-core" {
  interface Request {
    currentUser?: CurrentUser;
  }
}

export function resolveCurrentUser(req: Request, database: DatabaseHandle, env: AppEnv) {
  const token = readSessionToken(req.headers.cookie);
  return getCurrentUserFromToken(database.db, token, env);
}

export function requireAuth(database: DatabaseHandle, env: AppEnv) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = resolveCurrentUser(req, database, env);

    if (!user) {
      next(new ApiError(401, "UNAUTHENTICATED", "Authentication required"));
      return;
    }

    req.currentUser = user;
    next();
  };
}
