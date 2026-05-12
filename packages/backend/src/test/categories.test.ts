import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, type TestServer } from './server.js';

function extractSessionCookie(res: Response): string {
  const header = res.headers.get('set-cookie') ?? '';
  const match = header.match(/connect\.sid=[^;]+/);
  return match ? match[0] : '';
}

async function loginAs(
  url: string,
  email: string,
  displayName: string,
): Promise<{ cookie: string; userId: number }> {
  const res = await fetch(`${url}/api/auth/test/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { id: number };
  return { cookie: extractSessionCookie(res), userId: body.id };
}

describe('Categories API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  // --- auth guard ---

  it('GET /api/categories returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/categories`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/categories returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Food' }),
    });
    expect(res.status).toBe(401);
  });

  // --- list ---

  it('GET /api/categories returns empty array for new user', async () => {
    const { cookie } = await loginAs(server.url, 'alice@example.com', 'Alice');
    const res = await fetch(`${server.url}/api/categories`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  // --- create ---

  it('POST /api/categories creates a category and returns 201', async () => {
    const { cookie } = await loginAs(server.url, 'bob@example.com', 'Bob');
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Groceries' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; name: string; userId: number };
    expect(body.id).toBeTypeOf('number');
    expect(body.name).toBe('Groceries');
    expect(body.userId).toBeTypeOf('number');
  });

  it('POST /api/categories returns 400 when name is empty', async () => {
    const { cookie } = await loginAs(server.url, 'carol@example.com', 'Carol');
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/categories returns 409 on duplicate name for same user', async () => {
    const { cookie } = await loginAs(server.url, 'dave@example.com', 'Dave');
    await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Transport' }),
    });
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Transport' }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CONFLICT');
  });

  it('POST /api/categories allows same name for different users', async () => {
    const { cookie: cookieE } = await loginAs(server.url, 'eve@example.com', 'Eve');
    const { cookie: cookieF } = await loginAs(server.url, 'frank@example.com', 'Frank');
    const res1 = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieE },
      body: JSON.stringify({ name: 'Health' }),
    });
    expect(res1.status).toBe(201);
    const res2 = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieF },
      body: JSON.stringify({ name: 'Health' }),
    });
    expect(res2.status).toBe(201);
  });

  it("GET /api/categories returns only the authenticated user's categories", async () => {
    const { cookie: cookieG } = await loginAs(server.url, 'grace@example.com', 'Grace');
    const { cookie: cookieH } = await loginAs(server.url, 'hank@example.com', 'Hank');

    await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieG },
      body: JSON.stringify({ name: 'Grace Only' }),
    });

    const res = await fetch(`${server.url}/api/categories`, { headers: { Cookie: cookieH } });
    const list = (await res.json()) as { name: string }[];
    expect(list.find((c) => c.name === 'Grace Only')).toBeUndefined();
  });

  // --- rename (PUT) ---

  it('PUT /api/categories/:id renames a category', async () => {
    const { cookie } = await loginAs(server.url, 'ivy@example.com', 'Ivy');
    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Old Name' }),
    });
    const created = (await createRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'New Name' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: number; name: string };
    expect(body.name).toBe('New Name');
    expect(body.id).toBe(created.id);
  });

  it('PUT /api/categories/:id returns 404 when category belongs to another user', async () => {
    const { cookie: cookieJ } = await loginAs(server.url, 'judy@example.com', 'Judy');
    const { cookie: cookieK } = await loginAs(server.url, 'karl@example.com', 'Karl');

    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieJ },
      body: JSON.stringify({ name: 'Judy Only' }),
    });
    const created = (await createRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieK },
      body: JSON.stringify({ name: 'Hijack' }),
    });
    expect(res.status).toBe(404);
  });

  it('PUT /api/categories/:id returns 409 when renaming to an existing name', async () => {
    const { cookie } = await loginAs(server.url, 'leo@example.com', 'Leo');
    await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Alpha' }),
    });
    const betaRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Beta' }),
    });
    const beta = (await betaRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${beta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Alpha' }),
    });
    expect(res.status).toBe(409);
  });

  // --- delete ---

  it('DELETE /api/categories/:id deletes a category and returns 204', async () => {
    const { cookie } = await loginAs(server.url, 'mia@example.com', 'Mia');
    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Temporary' }),
    });
    const created = (await createRes.json()) as { id: number };

    const deleteRes = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(204);

    const listRes = await fetch(`${server.url}/api/categories`, { headers: { Cookie: cookie } });
    const list = (await listRes.json()) as { id: number }[];
    expect(list.find((c) => c.id === created.id)).toBeUndefined();
  });

  it('DELETE /api/categories/:id returns 404 when category belongs to another user', async () => {
    const { cookie: cookieN } = await loginAs(server.url, 'nina@example.com', 'Nina');
    const { cookie: cookieO } = await loginAs(server.url, 'otto@example.com', 'Otto');

    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieN },
      body: JSON.stringify({ name: 'Nina Only' }),
    });
    const created = (await createRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieO },
    });
    expect(res.status).toBe(404);
  });

  it('DELETE /api/categories/:id returns 409 when category has transactions', async () => {
    const { cookie } = await loginAs(server.url, 'pete@example.com', 'Pete');

    const catRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'WithTx' }),
    });
    const cat = (await catRes.json()) as { id: number };

    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        title: 'Blocking Tx',
        amount: 10,
        currency: 'USD',
        transactionDate: '2026-05-01',
        categoryId: cat.id,
      }),
    });

    const res = await fetch(`${server.url}/api/categories/${cat.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CONFLICT');
  });
});
