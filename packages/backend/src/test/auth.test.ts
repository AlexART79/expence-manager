import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, type TestServer } from './server.js';

function extractSessionCookie(res: Response): string {
  const header = res.headers.get('set-cookie') ?? '';
  const match = header.match(/connect\.sid=[^;]+/);
  return match ? match[0] : '';
}

describe('Auth endpoints', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /api/auth/me returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/auth/me`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/test/login creates session and /me returns user', async () => {
    const loginRes = await fetch(`${server.url}/api/auth/test/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alice@example.com', displayName: 'Alice' }),
    });
    expect(loginRes.status).toBe(200);
    const cookie = extractSessionCookie(loginRes);
    expect(cookie).not.toBe('');

    const meRes = await fetch(`${server.url}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    expect(meRes.status).toBe(200);
    const me = (await meRes.json()) as { email: string; displayName: string };
    expect(me.email).toBe('alice@example.com');
    expect(me.displayName).toBe('Alice');
  });

  it('POST /api/auth/logout clears session', async () => {
    const loginRes = await fetch(`${server.url}/api/auth/test/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bob@example.com', displayName: 'Bob' }),
    });
    const cookie = extractSessionCookie(loginRes);

    const logoutRes = await fetch(`${server.url}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    expect(logoutRes.status).toBe(200);

    const meRes = await fetch(`${server.url}/api/auth/me`, {
      headers: { Cookie: cookie },
    });
    expect(meRes.status).toBe(401);
  });

  it('second login with same credentials returns same user id (upsert)', async () => {
    const login1 = await fetch(`${server.url}/api/auth/test/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', displayName: 'Carol' }),
    });
    const user1 = (await login1.json()) as { id: number };

    const login2 = await fetch(`${server.url}/api/auth/test/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'carol@example.com', displayName: 'Carol Updated' }),
    });
    const user2 = (await login2.json()) as { id: number; displayName: string };

    expect(user2.id).toBe(user1.id);
    expect(user2.displayName).toBe('Carol Updated');
  });
});
