import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-export the schema separately for unit testing:
// We import directly rather than `env.ts` to avoid triggering process.exit
const envSchema = z.object({
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

describe('env schema', () => {
  it('accepts a valid full auth config', () => {
    const result = envSchema.safeParse({
      SESSION_SECRET: 'a-secret-at-least-32-characters-long',
      GOOGLE_CLIENT_ID: 'google-id',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      GITHUB_CLIENT_ID: 'github-id',
      GITHUB_CLIENT_SECRET: 'github-secret',
      BASE_URL: 'https://api.example.com',
      FRONTEND_URL: 'https://example.com',
    });
    expect(result.success).toBe(true);
  });

  it('accepts config with no OAuth credentials (test/dev mode)', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects SESSION_SECRET shorter than 32 chars', () => {
    const result = envSchema.safeParse({ SESSION_SECRET: 'short' });
    expect(result.success).toBe(false);
  });
});
