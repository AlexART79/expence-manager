import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, type TestServer } from './server.js';

function extractSessionCookie(res: Response): string {
  const header = res.headers.get('set-cookie') ?? '';
  const match = header.match(/connect\.sid=[^;]+/);
  return match ? match[0] : '';
}

async function loginAs(url: string, email: string): Promise<{ cookie: string; userId: number }> {
  const res = await fetch(`${url}/api/auth/test/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName: email }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { id: number };
  return { cookie: extractSessionCookie(res), userId: body.id };
}

async function loginWithCategory(
  url: string,
  email: string,
): Promise<{ cookie: string; categoryId: number }> {
  const { cookie } = await loginAs(url, email);
  const catRes = await fetch(`${url}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: 'Food' }),
  });
  const cat = (await catRes.json()) as { id: number };
  return { cookie, categoryId: cat.id };
}

async function addTransaction(
  url: string,
  cookie: string,
  categoryId: number,
  amount: number,
  date: string,
) {
  const res = await fetch(`${url}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: 'Test',
      amount,
      currency: 'USD',
      transactionDate: date,
      categoryId,
    }),
  });
  expect(res.status).toBe(201);
}

describe('Budgets API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });
  afterAll(async () => {
    await server.close();
  });

  // --- auth guards ---

  it('GET /api/budgets/:month returns 401 when unauthenticated', async () => {
    const res = await fetch(`${server.url}/api/budgets/2026-05`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('PUT /api/budgets/:month returns 401 when unauthenticated', async () => {
    const res = await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1000, currency: 'USD' }),
    });
    expect(res.status).toBe(401);
  });

  it('GET /api/budgets/:month/summary returns 401 when unauthenticated', async () => {
    const res = await fetch(`${server.url}/api/budgets/2026-05/summary`);
    expect(res.status).toBe(401);
  });

  // --- validation ---

  it('PUT /api/budgets/:month returns 400 for malformed month (missing leading zero)', async () => {
    const { cookie } = await loginAs(server.url, 'val1@ex.com');
    const res = await fetch(`${server.url}/api/budgets/2026-5`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 1000, currency: 'USD' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /api/budgets/:month returns 400 for non-positive amount', async () => {
    const { cookie } = await loginAs(server.url, 'val2@ex.com');
    const res = await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: -100, currency: 'USD' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT /api/budgets/:month returns 400 for zero amount', async () => {
    const { cookie } = await loginAs(server.url, 'val3@ex.com');
    const res = await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 0, currency: 'USD' }),
    });
    expect(res.status).toBe(400);
  });

  // --- set and get budget ---

  it('PUT /api/budgets/:month creates a budget and returns 200', async () => {
    const { cookie } = await loginAs(server.url, 'set1@ex.com');
    const res = await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 2000, currency: 'USD' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { month: string; amount: number; currency: string };
    expect(body.month).toBe('2026-05');
    expect(body.amount).toBe(2000);
    expect(body.currency).toBe('USD');
  });

  it('PUT /api/budgets/:month updates existing budget on second call', async () => {
    const { cookie } = await loginAs(server.url, 'set2@ex.com');
    await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 1000, currency: 'USD' }),
    });
    const res = await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 1500, currency: 'USD' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number };
    expect(body.amount).toBe(1500);
  });

  it('GET /api/budgets/:month returns 200 with budget when one is set', async () => {
    const { cookie } = await loginAs(server.url, 'get1@ex.com');
    await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 3000, currency: 'USD' }),
    });
    const res = await fetch(`${server.url}/api/budgets/2026-05`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { amount: number };
    expect(body.amount).toBe(3000);
  });

  it('GET /api/budgets/:month returns 404 when no budget is set', async () => {
    const { cookie } = await loginAs(server.url, 'get2@ex.com');
    const res = await fetch(`${server.url}/api/budgets/2026-05`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it("GET /api/budgets/:month returns 404 for another user's budget", async () => {
    const { cookie: cookieA } = await loginAs(server.url, 'iso1a@ex.com');
    const { cookie: cookieB } = await loginAs(server.url, 'iso1b@ex.com');
    await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ amount: 500, currency: 'USD' }),
    });
    const res = await fetch(`${server.url}/api/budgets/2026-05`, { headers: { Cookie: cookieB } });
    expect(res.status).toBe(404);
  });

  // --- summary ---

  it('GET /api/budgets/:month/summary returns correct totals with budget set', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'sum1@ex.com');
    await addTransaction(server.url, cookie, categoryId, 200, '2026-05-01');
    await addTransaction(server.url, cookie, categoryId, 100, '2026-05-15');
    await fetch(`${server.url}/api/budgets/2026-05`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ amount: 1000, currency: 'USD' }),
    });

    const res = await fetch(`${server.url}/api/budgets/2026-05/summary`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      month: string;
      totalSpent: number;
      budgetAmount: number;
      remaining: number;
      usagePercent: number;
      currency: string;
    };
    expect(body.month).toBe('2026-05');
    expect(body.totalSpent).toBe(300);
    expect(body.budgetAmount).toBe(1000);
    expect(body.remaining).toBe(700);
    expect(body.usagePercent).toBeCloseTo(30);
    expect(body.currency).toBe('USD');
  });

  it('GET /api/budgets/:month/summary returns null budget fields when no budget is set', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'sum2@ex.com');
    await addTransaction(server.url, cookie, categoryId, 150, '2026-05-10');

    const res = await fetch(`${server.url}/api/budgets/2026-05/summary`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      totalSpent: number;
      budgetAmount: unknown;
      remaining: unknown;
      usagePercent: unknown;
    };
    expect(body.totalSpent).toBe(150);
    expect(body.budgetAmount).toBeNull();
    expect(body.remaining).toBeNull();
    expect(body.usagePercent).toBeNull();
  });

  it('GET /api/budgets/:month/summary excludes transactions from other months', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'sum3@ex.com');
    await addTransaction(server.url, cookie, categoryId, 500, '2026-04-30'); // April — must not count
    await addTransaction(server.url, cookie, categoryId, 100, '2026-05-01'); // May — counts
    await addTransaction(server.url, cookie, categoryId, 200, '2026-06-01'); // June — must not count

    const res = await fetch(`${server.url}/api/budgets/2026-05/summary`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { totalSpent: number };
    expect(body.totalSpent).toBe(100);
  });

  it('GET /api/budgets/:month/summary returns totalSpent 0 when no transactions exist', async () => {
    const { cookie } = await loginAs(server.url, 'sum4@ex.com');
    const res = await fetch(`${server.url}/api/budgets/2026-05/summary`, {
      headers: { Cookie: cookie },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { totalSpent: number };
    expect(body.totalSpent).toBe(0);
  });
});
