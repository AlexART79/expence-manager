import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createTestDatabase } from "../test/helpers/db.js";

function getSessionCookie(response: request.Response) {
  const cookie = response.headers["set-cookie"]?.[0];
  expect(cookie).toBeDefined();
  return cookie as string;
}

describe("auth routes", () => {
  beforeEach(() => {
    process.env.AUTH_TEST_MODE = "true";
    process.env.FRONTEND_URL = "http://localhost:5173";
  });

  it("rejects current-user requests without a session", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required"
      }
    });

    database.sqlite.close();
  });

  it("creates a Google user and session through the test-mode callback", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const callback = await request(app).get("/api/auth/google/callback?code=test-google");

    expect(callback.status).toBe(302);
    expect(callback.headers.location).toBe("http://localhost:5173");
    const sessionCookie = getSessionCookie(callback);
    expect(sessionCookie).toContain("expense_session=");
    expect(sessionCookie).toContain("HttpOnly");

    const me = await request(app).get("/api/auth/me").set("Cookie", sessionCookie);
    expect(me.status).toBe(200);
    expect(me.body).toEqual({
      user: {
        id: expect.any(Number),
        provider: "google",
        email: "google.user@example.com",
        displayName: "Google Test User",
        avatarUrl: "https://example.com/google.png"
      }
    });

    database.sqlite.close();
  });

  it("creates a GitHub user and session through the test-mode callback", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const callback = await request(app).get("/api/auth/github/callback?code=test-github");
    const me = await request(app).get("/api/auth/me").set("Cookie", getSessionCookie(callback));

    expect(me.status).toBe(200);
    expect(me.body.user.provider).toBe("github");
    expect(me.body.user.email).toBeNull();
    expect(me.body.user.displayName).toBe("GitHub Test User");

    database.sqlite.close();
  });

  it("logs out by expiring the session and clearing the cookie", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const callback = await request(app).get("/api/auth/google/callback?code=test-google");
    const sessionCookie = getSessionCookie(callback);

    const logout = await request(app).post("/api/auth/logout").set("Cookie", sessionCookie);
    const me = await request(app).get("/api/auth/me").set("Cookie", sessionCookie);

    expect(logout.status).toBe(204);
    expect(getSessionCookie(logout)).toContain("expense_session=;");
    expect(me.status).toBe(401);

    database.sqlite.close();
  });

  it("returns the shared API error shape for invalid providers", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const response = await request(app).get("/api/auth/not-a-provider/callback?code=test");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Unsupported auth provider",
        details: { provider: "not-a-provider" }
      }
    });

    database.sqlite.close();
  });
});
