import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1).default('./data/app.db'),
  SESSION_SECRET: z.string().min(32).default('dev-secret-change-in-prod-32-chars!!'),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
