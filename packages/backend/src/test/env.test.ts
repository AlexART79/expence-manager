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
      CORS_ORIGIN: "http://localhost:5173"
    });

    expect(env).toEqual({
      nodeEnv: "test",
      host: "0.0.0.0",
      port: 4010,
      databaseFile: ":memory:",
      logLevel: "debug",
      corsOrigin: "http://localhost:5173"
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
