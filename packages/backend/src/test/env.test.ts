import { describe, it, expect } from 'vitest';
import { envSchema } from '../env.js';

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

  it('uses defaults when no credentials provided', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects SESSION_SECRET shorter than 32 chars', () => {
    const result = envSchema.safeParse({ SESSION_SECRET: 'short' });
    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors['SESSION_SECRET']).toBeDefined();
  });
});
