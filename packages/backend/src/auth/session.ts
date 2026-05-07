import { randomBytes, createHmac } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { Response } from "express";
import { parse, serialize } from "cookie";
import type { AppEnv } from "../env.js";
import type { DatabaseHandle } from "../db/connection.js";
import { sessions, users } from "../db/schema/index.js";
import type { CurrentUser } from "./types.js";
import { toCurrentUser } from "./users.js";

const SESSION_COOKIE = "expense_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type Db = DatabaseHandle["db"];

export function readSessionToken(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return null;
  }

  return parse(cookieHeader)[SESSION_COOKIE] ?? null;
}

export function hashSessionToken(token: string, secret: string) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function createSession(db: Db, userId: number, env: AppEnv) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  db.insert(sessions)
    .values({
      userId,
      tokenHash: hashSessionToken(token, env.sessionSecret),
      expiresAt,
      createdAt: now
    })
    .run();

  return { token, expiresAt };
}

export function getCurrentUserFromToken(db: Db, token: string | null, env: AppEnv): CurrentUser | null {
  if (!token) {
    return null;
  }

  const session = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, hashSessionToken(token, env.sessionSecret)), gt(sessions.expiresAt, Date.now())))
    .get();

  if (!session) {
    return null;
  }

  const user = db.select().from(users).where(eq(users.id, session.userId)).get();
  return user ? toCurrentUser(user) : null;
}

export function expireSession(db: Db, token: string | null, env: AppEnv) {
  if (!token) {
    return;
  }

  db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token, env.sessionSecret))).run();
}

export function setSessionCookie(res: Response, token: string, expiresAt: number, env: AppEnv) {
  res.setHeader(
    "Set-Cookie",
    serialize(SESSION_COOKIE, token, {
      expires: new Date(expiresAt),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: env.nodeEnv === "production"
    })
  );
}

export function clearSessionCookie(res: Response, env: AppEnv) {
  res.setHeader(
    "Set-Cookie",
    serialize(SESSION_COOKIE, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: env.nodeEnv === "production"
    })
  );
}
