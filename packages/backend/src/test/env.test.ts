import { describe, expect, it } from "vitest";
import { createEnv } from "../env.js";

describe("environment validation", () => {
  it("coerces valid env values into typed config", () => {
    const env = createEnv({
      NODE_ENV: "test",
      BACKEND_HOST: "0.0.0.0",
      BACKEND_PORT: "4010",
      DATABASE_FILE: ":memory:",
      LOG_LEVEL: "debug",
      CORS_ORIGIN: "http://localhost:5173",
      FRONTEND_URL: "http://localhost:5173",
      SESSION_SECRET: "test-session-secret",
      AUTH_TEST_MODE: "true",
      GOOGLE_CLIENT_ID: "google-client",
      GOOGLE_CLIENT_SECRET: "google-secret",
      GOOGLE_REDIRECT_URI: "http://127.0.0.1:4000/auth/google/callback",
      GITHUB_CLIENT_ID: "github-client",
      GITHUB_CLIENT_SECRET: "github-secret",
      GITHUB_REDIRECT_URI: "http://127.0.0.1:4000/auth/github/callback"
    });

    expect(env).toEqual({
      nodeEnv: "test",
      host: "0.0.0.0",
      port: 4010,
      databaseFile: ":memory:",
      logLevel: "debug",
      corsOrigin: "http://localhost:5173",
      frontendUrl: "http://localhost:5173",
      sessionSecret: "test-session-secret",
      authTestMode: true,
      googleClientId: "google-client",
      googleClientSecret: "google-secret",
      googleRedirectUri: "http://127.0.0.1:4000/auth/google/callback",
      githubClientId: "github-client",
      githubClientSecret: "github-secret",
      githubRedirectUri: "http://127.0.0.1:4000/auth/github/callback"
    });
  });

  it("rejects invalid ports with a validation error", () => {
    expect(() =>
      createEnv({
        BACKEND_PORT: "70000"
      })
    ).toThrow("Invalid environment configuration");
  });
});
