import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_HOST: z.string().min(1).default("127.0.0.1"),
  BACKEND_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_FILE: z.string().min(1).default("./data/app.db"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  SESSION_SECRET: z.string().min(16).default("development-session-secret"),
  AUTH_TEST_MODE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://127.0.0.1:4000/auth/google/callback"),
  GITHUB_CLIENT_ID: z.string().default(""),
  GITHUB_CLIENT_SECRET: z.string().default(""),
  GITHUB_REDIRECT_URI: z.string().url().default("http://127.0.0.1:4000/auth/github/callback")
});

export type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databaseFile: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  corsOrigin: string;
  frontendUrl: string;
  sessionSecret: string;
  authTestMode: boolean;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  githubClientId: string;
  githubClientSecret: string;
  githubRedirectUri: string;
};

export function createEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new Error("Invalid environment configuration", {
      cause: result.error.flatten()
    });
  }

  return {
    nodeEnv: result.data.NODE_ENV,
    host: result.data.BACKEND_HOST,
    port: result.data.BACKEND_PORT,
    databaseFile: result.data.DATABASE_FILE,
    logLevel: result.data.LOG_LEVEL,
    corsOrigin: result.data.CORS_ORIGIN,
    frontendUrl: result.data.FRONTEND_URL,
    sessionSecret: result.data.SESSION_SECRET,
    authTestMode: result.data.AUTH_TEST_MODE,
    googleClientId: result.data.GOOGLE_CLIENT_ID,
    googleClientSecret: result.data.GOOGLE_CLIENT_SECRET,
    googleRedirectUri: result.data.GOOGLE_REDIRECT_URI,
    githubClientId: result.data.GITHUB_CLIENT_ID,
    githubClientSecret: result.data.GITHUB_CLIENT_SECRET,
    githubRedirectUri: result.data.GITHUB_REDIRECT_URI
  };
}

export const env = createEnv();
