import 'dotenv/config';
import { z } from 'zod';

const DEV_SESSION_SECRET = 'dev-secret-change-in-prod-32-chars!!';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1).default('./data/app.db'),
  SESSION_SECRET: z
    .string()
    .min(32)
    .refine(
      (val) => process.env['NODE_ENV'] !== 'production' || val !== DEV_SESSION_SECRET,
      { message: 'SESSION_SECRET must be set to a unique value in production' },
    )
    .default(DEV_SESSION_SECRET),
  BASE_URL: z.string().url().default('http://localhost:3000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
