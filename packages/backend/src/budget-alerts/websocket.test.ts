import { createServer, type Server } from "node:http";
import { EventEmitter } from "node:events";
import request from "supertest";
import WebSocket from "ws";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { upsertBudget } from "../budgets/service.js";
import { createTestDatabase } from "../test/helpers/db.js";
import { attachBudgetAlertWebSocketServer, createBudgetAlertHub } from "./websocket.js";

class FakeBudgetAlertSocket extends EventEmitter {
  OPEN = 1;
  readyState = 1;
  sent: string[] = [];
  closed: { code: number; reason: string } | null = null;

  send(message: string, callback?: (error?: Error) => void) {
    this.sent.push(message);
    callback?.();
  }

  close(code: number, reason: string) {
    this.closed = { code, reason };
    this.emit("close");
  }
}

function getSessionCookie(response: request.Response) {
  const cookie = response.headers["set-cookie"]?.[0];
  expect(cookie).toBeDefined();
  return cookie as string;
}

async function signIn(app: ReturnType<typeof createApp>, provider: "google" | "github" = "google") {
  const code = provider === "google" ? "test-google" : "test-github";
  const callback = await request(app).get(`/api/auth/${provider}/callback?code=${code}`);
  return getSessionCookie(callback);
}

function listen(server: Server) {
  return new Promise<number>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      expect(address).toBeTruthy();
      resolve(typeof address === "string" ? 0 : address!.port);
    });
  });
}

function waitForOpen(socket: WebSocket) {
  return new Promise<void>((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function waitForMessage(socket: WebSocket) {
  return new Promise<unknown>((resolve) => {
    socket.once("message", (data) => resolve(JSON.parse(data.toString())));
  });
}

function waitForClose(socket: WebSocket) {
  return new Promise<{ code: number }>((resolve) => {
    socket.once("close", (code) => resolve({ code }));
  });
}

describe("budget alert WebSocket", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00.000Z"));
    process.env.AUTH_TEST_MODE = "true";
    process.env.FRONTEND_URL = "http://localhost:5173";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects unauthenticated upgrades and closes invalid subscription messages", async () => {
    const database = createTestDatabase();
    const hub = createBudgetAlertHub(database);
    const app = createApp({ database, budgetAlertNotifier: hub });
    const server = createServer(app);
    attachBudgetAlertWebSocketServer(server, database, hub);
    const port = await listen(server);

    const unauthenticated = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    await expect(waitForOpen(unauthenticated)).rejects.toThrow(/Unexpected server response: 401/);

    const sessionCookie = await signIn(app);
    const invalid = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Cookie: sessionCookie } });
    await waitForOpen(invalid);
    invalid.send(JSON.stringify({ type: "unknown" }));
    await expect(waitForClose(invalid)).resolves.toEqual({ code: 1008 });

    server.close();
    database.sqlite.close();
  });

  it("sends current-month threshold alerts only to authenticated subscribed users", async () => {
    const database = createTestDatabase();
    const hub = createBudgetAlertHub(database);
    const app = createApp({ database, budgetAlertNotifier: hub });
    const server = createServer(app);
    attachBudgetAlertWebSocketServer(server, database, hub);
    const port = await listen(server);
    const googleCookie = await signIn(app, "google");
    const githubCookie = await signIn(app, "github");
    const googleCategory = await request(app).post("/api/categories").set("Cookie", googleCookie).send({ name: "Food" });
    const githubCategory = await request(app).post("/api/categories").set("Cookie", githubCookie).send({ name: "Food" });

    upsertBudget(database.db, 1, "2026-05", { amount: "100.00", currency: "USD" });
    upsertBudget(database.db, 2, "2026-05", { amount: "100.00", currency: "USD" });

    const googleSocket = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Cookie: googleCookie } });
    const githubSocket = new WebSocket(`ws://127.0.0.1:${port}/ws`, { headers: { Cookie: githubCookie } });
    await Promise.all([waitForOpen(googleSocket), waitForOpen(githubSocket)]);
    googleSocket.send(JSON.stringify({ type: "budget_alerts.subscribe", payload: { month: "current" } }));
    githubSocket.send(JSON.stringify({ type: "budget_alerts.subscribe", payload: { month: "current" } }));

    const googleMessage = waitForMessage(googleSocket);
    await request(app)
      .post("/api/transactions")
      .set("Cookie", googleCookie)
      .send({
        title: "Groceries",
        amount: "80.00",
        transactionDate: "2026-05-09",
        categoryId: googleCategory.body.category.id,
        notes: null,
        currency: "USD"
      });

    await expect(googleMessage).resolves.toMatchObject({
      type: "budget_alerts.alert",
      payload: {
        month: "2026-05",
        threshold: 50,
        usagePercentage: 80,
        totalSpent: "80.00",
        budgetAmount: "100.00",
        currency: "USD"
      }
    });

    const githubMessage = waitForMessage(githubSocket);
    await request(app)
      .post("/api/transactions")
      .set("Cookie", githubCookie)
      .send({
        title: "Private",
        amount: "100.00",
        transactionDate: "2026-05-09",
        categoryId: githubCategory.body.category.id,
        notes: null,
        currency: "USD"
      });

    await expect(githubMessage).resolves.toMatchObject({
      type: "budget_alerts.alert",
      payload: {
        month: "2026-05",
        threshold: 50,
        usagePercentage: 100,
        totalSpent: "100.00",
        budgetAmount: "100.00",
        currency: "USD"
      }
    });

    googleSocket.close();
    githubSocket.close();
    server.close();
    database.sqlite.close();
  });

  it("keeps the socket handler from crashing when alert collection fails", () => {
    const database = createTestDatabase();
    const hub = createBudgetAlertHub(database);
    const socket = new FakeBudgetAlertSocket();

    database.sqlite.prepare(
      "insert into users (id, provider, provider_user_id, email, display_name, avatar_url, created_at, updated_at) values (1, 'google', 'test-google', null, 'Test User', null, 1, 1)"
    ).run();
    upsertBudget(database.db, 1, "2026-05", { amount: "100.00", currency: "USD" });
    database.sqlite.prepare(
      "insert into categories (id, user_id, name, normalized_name, created_at, updated_at) values (1, 1, 'Food', 'food', 1, 1)"
    ).run();
    database.sqlite.prepare(
      "insert into transactions (user_id, category_id, title, amount_cents, transaction_date, notes, currency, created_at, updated_at) values (1, 1, 'Groceries', 8000, '2026-05-09', null, 'USD', 1, 1)"
    ).run();
    database.sqlite.exec("drop table budget_alert_states");

    hub.addClient(
      socket as unknown as WebSocket,
      { id: 1, provider: "google", email: null, displayName: "Test User", avatarUrl: null }
    );

    expect(() => {
      socket.emit("message", Buffer.from(JSON.stringify({ type: "budget_alerts.subscribe", payload: { month: "current" } })));
    }).not.toThrow();
    expect(socket.closed).toBeNull();

    database.sqlite.close();
  });
});
