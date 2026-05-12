import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
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

async function setBudget(url: string, cookie: string, month: string, amount: number) {
  await fetch(`${url}/api/budgets/${month}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ amount, currency: 'USD' }),
  });
}

async function createTransaction(
  url: string,
  cookie: string,
  categoryId: number,
  amount: number,
  month: string,
) {
  const res = await fetch(`${url}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: 'Test',
      amount,
      currency: 'USD',
      transactionDate: `${month}-15`,
      categoryId,
    }),
  });
  expect(res.status).toBe(201);
  return (await res.json()) as { id: number };
}

function connectWs(wsUrl: string, cookie: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { headers: { Cookie: cookie } });
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function waitForMessage(ws: WebSocket, timeoutMs = 3000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`WS message not received within ${timeoutMs}ms`)),
      timeoutMs,
    );
    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
}

function waitForClose(ws: WebSocket, timeoutMs = 3000): Promise<number> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WS did not close in time')), timeoutMs);
    ws.once('close', (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

async function subscribeAndAwaitAck(
  ws: WebSocket,
  expectedMonth: string,
): Promise<void> {
  ws.send(JSON.stringify({ type: 'budget_alerts.subscribe', payload: { month: 'current' } }));
  const ack = (await waitForMessage(ws)) as { type: string; payload: { month: string } };
  expect(ack.type).toBe('budget_alerts.subscribed');
  expect(ack.payload.month).toBe(expectedMonth);
}

describe('WebSocket', () => {
  let server: TestServer;

  beforeAll(async () => { server = await startTestServer(); });
  afterAll(async () => { await server.close(); });

  const currentMonth = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  })();

  it('closes unauthenticated connections with code 1008', async () => {
    const ws = new WebSocket(server.wsUrl);
    const code = await waitForClose(ws);
    expect(code).toBe(1008);
  });

  it('accepts authenticated connections and stays open', async () => {
    const { cookie } = await loginAs(server.url, 'ws-auth@ex.com');
    const ws = await connectWs(server.wsUrl, cookie);
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('sends subscribed ack after subscribe message with current month', async () => {
    const { cookie } = await loginAs(server.url, 'ws-sub@ex.com');
    const ws = await connectWs(server.wsUrl, cookie);
    await subscribeAndAwaitAck(ws, currentMonth);
    ws.close();
  });

  it('ignores malformed messages without crashing', async () => {
    const { cookie } = await loginAs(server.url, 'ws-malformed@ex.com');
    const ws = await connectWs(server.wsUrl, cookie);
    ws.send('not-json');
    ws.send(JSON.stringify({ type: 'unknown' }));
    await new Promise((r) => setTimeout(r, 100));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  });

  it('sends 50% alert when spending reaches 50% of budget', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'ws-50pct@ex.com');
    await setBudget(server.url, cookie, currentMonth, 1000);

    const ws = await connectWs(server.wsUrl, cookie);
    await subscribeAndAwaitAck(ws, currentMonth);

    const msgPromise = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 500, currentMonth);

    const msg = (await msgPromise) as { type: string; payload: { threshold: number; month: string } };
    expect(msg.type).toBe('budget_alerts.alert');
    expect(msg.payload.threshold).toBe(50);
    expect(msg.payload.month).toBe(currentMonth);

    ws.close();
  });

  it('sends 80% alert when spending reaches 80% of budget', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'ws-80pct@ex.com');
    await setBudget(server.url, cookie, currentMonth, 1000);

    const ws = await connectWs(server.wsUrl, cookie);
    await subscribeAndAwaitAck(ws, currentMonth);

    const first = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 500, currentMonth);
    await first;

    const second = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 300, currentMonth);
    const msg = (await second) as { type: string; payload: { threshold: number } };
    expect(msg.payload.threshold).toBe(80);

    ws.close();
  });

  it('sends 100% alert when budget is exceeded', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'ws-100pct@ex.com');
    await setBudget(server.url, cookie, currentMonth, 1000);

    const ws = await connectWs(server.wsUrl, cookie);
    await subscribeAndAwaitAck(ws, currentMonth);

    const first = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 500, currentMonth);
    await first;

    const second = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 300, currentMonth);
    await second;

    const third = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 200, currentMonth);
    const msg = (await third) as { type: string; payload: { threshold: number } };
    expect(msg.payload.threshold).toBe(100);

    ws.close();
  });

  it('does not re-send a threshold that was already alerted in the same session', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'ws-nodup@ex.com');
    await setBudget(server.url, cookie, currentMonth, 1000);

    const ws = await connectWs(server.wsUrl, cookie);
    await subscribeAndAwaitAck(ws, currentMonth);

    const first = waitForMessage(ws);
    await createTransaction(server.url, cookie, categoryId, 500, currentMonth);
    await first;

    let gotExtra = false;
    ws.once('message', () => { gotExtra = true; });
    await createTransaction(server.url, cookie, categoryId, 100, currentMonth);
    await new Promise((r) => setTimeout(r, 300));
    expect(gotExtra).toBe(false);

    ws.close();
  });

  it('does not send alerts to other users', async () => {
    const { cookie: cookieA, categoryId } = await loginWithCategory(server.url, 'ws-iso-a@ex.com');
    const { cookie: cookieB } = await loginAs(server.url, 'ws-iso-b@ex.com');
    await setBudget(server.url, cookieA, currentMonth, 1000);

    const wsB = await connectWs(server.wsUrl, cookieB);
    await subscribeAndAwaitAck(wsB, currentMonth);

    let bGotAlert = false;
    wsB.once('message', () => { bGotAlert = true; });

    await createTransaction(server.url, cookieA, categoryId, 500, currentMonth);
    await new Promise((r) => setTimeout(r, 300));
    expect(bGotAlert).toBe(false);

    wsB.close();
  });

  it('does not send alerts to connections that have not subscribed', async () => {
    const { cookie, categoryId } = await loginWithCategory(server.url, 'ws-nosub@ex.com');
    await setBudget(server.url, cookie, currentMonth, 1000);

    const ws = await connectWs(server.wsUrl, cookie);

    let gotAlert = false;
    ws.once('message', () => { gotAlert = true; });
    await createTransaction(server.url, cookie, categoryId, 500, currentMonth);
    await new Promise((r) => setTimeout(r, 300));
    expect(gotAlert).toBe(false);

    ws.close();
  });
});
