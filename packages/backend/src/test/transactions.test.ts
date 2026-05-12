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

async function setupUserWithCategory(
  url: string,
  email: string,
  name: string,
  categoryName: string,
): Promise<{ cookie: string; userId: number; categoryId: number }> {
  const { cookie, userId } = await loginAs(url, email, name);
  const catRes = await fetch(`${url}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: categoryName }),
  });
  const cat = (await catRes.json()) as { id: number };
  return { cookie, userId, categoryId: cat.id };
}

function txBody(categoryId: number) {
  return {
    title: 'Groceries',
    amount: 45.5,
    currency: 'USD',
    transactionDate: '2026-05-01',
    categoryId,
    notes: 'weekly shop',
  };
}

describe('Transactions API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });
  afterAll(async () => {
    await server.close();
  });

  // --- auth guard ---

  it('GET /api/transactions returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/transactions`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/transactions returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test',
        amount: 10,
        currency: 'USD',
        transactionDate: '2026-05-01',
        categoryId: 1,
      }),
    });
    expect(res.status).toBe(401);
  });

  // --- create ---

  it('POST /api/transactions creates a transaction and returns 201', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'alice-tx1@ex.com',
      'Alice1',
      'Food',
    );
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(categoryId)),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      id: number;
      title: string;
      amount: number;
      categoryId: number;
      currency: string;
    };
    expect(body.id).toBeTypeOf('number');
    expect(body.title).toBe('Groceries');
    expect(body.amount).toBe(45.5);
    expect(body.categoryId).toBe(categoryId);
    expect(body.currency).toBe('USD');
  });

  it('POST /api/transactions returns 400 for empty title', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'alice-tx2@ex.com',
      'Alice2',
      'Food',
    );
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/transactions returns 400 for non-positive amount', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'alice-tx3@ex.com',
      'Alice3',
      'Food',
    );
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), amount: -5 }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/transactions returns 400 for invalid date format', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'alice-tx4@ex.com',
      'Alice4',
      'Food',
    );
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), transactionDate: '01/05/2026' }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/transactions returns 400 when categoryId belongs to another user', async () => {
    const { cookie } = await setupUserWithCategory(server.url, 'bob-tx1@ex.com', 'Bob1', 'Food');
    const { categoryId: otherCatId } = await setupUserWithCategory(
      server.url,
      'carol-tx1@ex.com',
      'Carol1',
      'Food',
    );
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(otherCatId)),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  // --- list + filters ---

  it('GET /api/transactions returns empty array for new user', async () => {
    const { cookie } = await loginAs(server.url, 'new-tx1@ex.com', 'NewUser1');
    const res = await fetch(`${server.url}/api/transactions`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(0);
  });

  it("GET /api/transactions returns only the authenticated user's transactions", async () => {
    const { cookie: cookieA, categoryId: catA } = await setupUserWithCategory(
      server.url,
      'dave-tx1@ex.com',
      'Dave1',
      'Food',
    );
    const { cookie: cookieB } = await setupUserWithCategory(
      server.url,
      'eve-tx1@ex.com',
      'Eve1',
      'Food',
    );
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify(txBody(catA)),
    });
    const res = await fetch(`${server.url}/api/transactions`, { headers: { Cookie: cookieB } });
    const list = (await res.json()) as unknown[];
    expect(list).toHaveLength(0);
  });

  it('GET /api/transactions?search= filters by title', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'frank-tx1@ex.com',
      'Frank1',
      'Food',
    );
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Grocery Store' }),
    });
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Gas Station' }),
    });
    const res = await fetch(`${server.url}/api/transactions?search=Grocery`, {
      headers: { Cookie: cookie },
    });
    const list = (await res.json()) as { title: string }[];
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('Grocery Store');
  });

  it('GET /api/transactions?categoryId= filters by category', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'grace-tx1@ex.com',
      'Grace1',
      'Food',
    );
    const catRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Transport' }),
    });
    const cat2 = (await catRes.json()) as { id: number };
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Groceries' }),
    });
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(cat2.id), title: 'Bus pass' }),
    });
    const res = await fetch(`${server.url}/api/transactions?categoryId=${categoryId}`, {
      headers: { Cookie: cookie },
    });
    const list = (await res.json()) as { title: string }[];
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('Groceries');
  });

  // --- update ---

  it('PUT /api/transactions/:id updates a transaction', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'hank-tx1@ex.com',
      'Hank1',
      'Food',
    );
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(categoryId)),
    });
    const created = (await createRes.json()) as { id: number };
    const res = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Updated Title', amount: 99 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; amount: number };
    expect(body.title).toBe('Updated Title');
    expect(body.amount).toBe(99);
  });

  it('PUT /api/transactions/:id returns 404 when transaction belongs to another user', async () => {
    const { cookie: cookieA, categoryId: catA } = await setupUserWithCategory(
      server.url,
      'ivy-tx1@ex.com',
      'Ivy1',
      'Food',
    );
    const { cookie: cookieB, categoryId: catB } = await setupUserWithCategory(
      server.url,
      'judy-tx1@ex.com',
      'Judy1',
      'Food',
    );
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify(txBody(catA)),
    });
    const created = (await createRes.json()) as { id: number };
    const res = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify(txBody(catB)),
    });
    expect(res.status).toBe(404);
  });

  // --- delete ---

  it('DELETE /api/transactions/:id deletes a transaction and returns 204', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(
      server.url,
      'karl-tx1@ex.com',
      'Karl1',
      'Food',
    );
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(categoryId)),
    });
    const created = (await createRes.json()) as { id: number };
    const deleteRes = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(204);
    const listRes = await fetch(`${server.url}/api/transactions`, { headers: { Cookie: cookie } });
    const list = (await listRes.json()) as { id: number }[];
    expect(list.find((t) => t.id === created.id)).toBeUndefined();
  });

  it('DELETE /api/transactions/:id returns 404 when transaction belongs to another user', async () => {
    const { cookie: cookieA, categoryId: catA } = await setupUserWithCategory(
      server.url,
      'leo-tx1@ex.com',
      'Leo1',
      'Food',
    );
    const { cookie: cookieB } = await setupUserWithCategory(
      server.url,
      'mia-tx1@ex.com',
      'Mia1',
      'Food',
    );
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify(txBody(catA)),
    });
    const created = (await createRes.json()) as { id: number };
    const res = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });
});
