import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_HOST: z.string().min(1).default("127.0.0.1"),
  BACKEND_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_FILE: z.string().min(1).default("./data/app.db"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173")
});

export type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databaseFile: string;
  logLevel: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
  corsOrigin: string;
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
    corsOrigin: result.data.CORS_ORIGIN
  };
}

export const env = createEnv();
