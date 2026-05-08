import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createTestDatabase } from "../test/helpers/db.js";

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

async function createCategory(app: ReturnType<typeof createApp>, sessionCookie: string, name: string) {
  const response = await request(app).post("/api/categories").set("Cookie", sessionCookie).send({ name });
  expect(response.status).toBe(201);
  return response.body.category as { id: number; name: string };
}

async function createTransaction(
  app: ReturnType<typeof createApp>,
  sessionCookie: string,
  categoryId: number,
  input: { title: string; amount: string; transactionDate: string }
) {
  const response = await request(app)
    .post("/api/transactions")
    .set("Cookie", sessionCookie)
    .send({
      title: input.title,
      amount: input.amount,
      transactionDate: input.transactionDate,
      categoryId,
      notes: null,
      currency: "USD"
    });
  expect(response.status).toBe(201);
  return response.body.transaction;
}

describe("budget routes", () => {
  beforeEach(() => {
    process.env.AUTH_TEST_MODE = "true";
    process.env.FRONTEND_URL = "http://localhost:5173";
  });

  it("rejects unauthenticated budget requests", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const response = await request(app).get("/api/budgets/2026-05/summary");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required"
      }
    });

    database.sqlite.close();
  });

  it("validates budget month, amount, and currency", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);

    const invalidMonth = await request(app).get("/api/budgets/2026-13/summary").set("Cookie", sessionCookie);
    const invalidAmount = await request(app)
      .put("/api/budgets/2026-05")
      .set("Cookie", sessionCookie)
      .send({ amount: "0", currency: "USD" });
    const invalidCurrency = await request(app)
      .put("/api/budgets/2026-05")
      .set("Cookie", sessionCookie)
      .send({ amount: "100.00", currency: "EUR" });

    expect(invalidMonth.status).toBe(400);
    expect(invalidMonth.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidAmount.status).toBe(400);
    expect(invalidAmount.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidCurrency.status).toBe(400);
    expect(invalidCurrency.body.error.code).toBe("VALIDATION_ERROR");

    database.sqlite.close();
  });

  it("creates, updates, and gets the signed-in user's monthly budget", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);

    const created = await request(app)
      .put("/api/budgets/2026-05")
      .set("Cookie", sessionCookie)
      .send({ amount: "500.25", currency: "USD" });
    const updated = await request(app)
      .put("/api/budgets/2026-05")
      .set("Cookie", sessionCookie)
      .send({ amount: "650", currency: "USD" });
    const fetched = await request(app).get("/api/budgets/2026-05").set("Cookie", sessionCookie);

    expect(created.status).toBe(200);
    expect(created.body.budget).toMatchObject({
      id: expect.any(Number),
      month: "2026-05",
      amount: "500.25",
      amountCents: 50025,
      currency: "USD"
    });
    expect(updated.status).toBe(200);
    expect(updated.body.budget).toMatchObject({
      id: created.body.budget.id,
      month: "2026-05",
      amount: "650.00",
      amountCents: 65000,
      currency: "USD"
    });
    expect(fetched.body.budget).toMatchObject({
      id: created.body.budget.id,
      amount: "650.00"
    });

    database.sqlite.close();
  });

  it("returns a no-budget summary with selected-month spending", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);
    const category = await createCategory(app, sessionCookie, "Food");

    await createTransaction(app, sessionCookie, category.id, {
      title: "Lunch",
      amount: "12.50",
      transactionDate: "2026-05-08"
    });

    const response = await request(app).get("/api/budgets/2026-05/summary").set("Cookie", sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.summary).toEqual({
      month: "2026-05",
      budget: null,
      totalSpent: "12.50",
      totalSpentCents: 1250,
      remaining: null,
      remainingCents: null,
      usagePercentage: null,
      currency: "USD"
    });

    database.sqlite.close();
  });

  it("calculates summary totals, remaining budget, and usage percentage for the selected month", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const googleSession = await signIn(app, "google");
    const githubSession = await signIn(app, "github");
    const googleCategory = await createCategory(app, googleSession, "Food");
    const githubCategory = await createCategory(app, githubSession, "Food");

    await request(app)
      .put("/api/budgets/2026-05")
      .set("Cookie", googleSession)
      .send({ amount: "100.00", currency: "USD" });
    await request(app)
      .put("/api/budgets/2026-05")
      .set("Cookie", githubSession)
      .send({ amount: "999.00", currency: "USD" });
    await createTransaction(app, googleSession, googleCategory.id, {
      title: "Groceries",
      amount: "40.00",
      transactionDate: "2026-05-01"
    });
    await createTransaction(app, googleSession, googleCategory.id, {
      title: "Dinner",
      amount: "75.50",
      transactionDate: "2026-05-31"
    });
    await createTransaction(app, googleSession, googleCategory.id, {
      title: "June coffee",
      amount: "9.00",
      transactionDate: "2026-06-01"
    });
    await createTransaction(app, githubSession, githubCategory.id, {
      title: "Private",
      amount: "500.00",
      transactionDate: "2026-05-10"
    });

    const response = await request(app).get("/api/budgets/2026-05/summary").set("Cookie", googleSession);

    expect(response.status).toBe(200);
    expect(response.body.summary).toMatchObject({
      month: "2026-05",
      totalSpent: "115.50",
      totalSpentCents: 11550,
      remaining: "-15.50",
      remainingCents: -1550,
      usagePercentage: 115.5,
      currency: "USD"
    });
    expect(response.body.summary.budget).toMatchObject({
      amount: "100.00",
      amountCents: 10000
    });

    database.sqlite.close();
  });
});
