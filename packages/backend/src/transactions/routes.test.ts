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

describe("transaction routes", () => {
  beforeEach(() => {
    process.env.AUTH_TEST_MODE = "true";
    process.env.FRONTEND_URL = "http://localhost:5173";
  });

  it("rejects unauthenticated transaction requests", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });

    const response = await request(app).get("/api/transactions");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required"
      }
    });

    database.sqlite.close();
  });

  it("creates, lists, updates, and deletes the signed-in user's transactions", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);
    const category = await createCategory(app, sessionCookie, "Groceries");

    const created = await request(app).post("/api/transactions").set("Cookie", sessionCookie).send({
      title: "  Weekly food shop  ",
      amount: "42.35",
      transactionDate: "2026-05-08",
      categoryId: category.id,
      notes: "Bread and vegetables",
      currency: "USD"
    });
    const listed = await request(app).get("/api/transactions").set("Cookie", sessionCookie);
    const updated = await request(app).patch(`/api/transactions/${created.body.transaction.id}`).set("Cookie", sessionCookie).send({
      title: "Market run",
      amount: "50",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: "",
      currency: "USD"
    });
    const deleted = await request(app)
      .delete(`/api/transactions/${created.body.transaction.id}`)
      .set("Cookie", sessionCookie);
    const afterDelete = await request(app).get("/api/transactions").set("Cookie", sessionCookie);

    expect(created.status).toBe(201);
    expect(created.body.transaction).toEqual({
      id: expect.any(Number),
      categoryId: category.id,
      title: "Weekly food shop",
      amount: "42.35",
      amountCents: 4235,
      transactionDate: "2026-05-08",
      notes: "Bread and vegetables",
      currency: "USD",
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number)
    });
    expect(listed.body.transactions).toHaveLength(1);
    expect(updated.status).toBe(200);
    expect(updated.body.transaction).toMatchObject({
      title: "Market run",
      amount: "50.00",
      amountCents: 5000,
      notes: null
    });
    expect(deleted.status).toBe(204);
    expect(afterDelete.body.transactions).toEqual([]);

    database.sqlite.close();
  });

  it("rejects invalid transaction bodies and filters", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);

    const invalidBody = await request(app).post("/api/transactions").set("Cookie", sessionCookie).send({
      title: " ",
      amount: "0",
      transactionDate: "2026-15-99",
      categoryId: 999,
      notes: "x".repeat(501),
      currency: "EUR"
    });
    const invalidFilters = await request(app)
      .get("/api/transactions?dateFrom=2026-02-30&amountMin=-1&categoryId=nope")
      .set("Cookie", sessionCookie);

    expect(invalidBody.status).toBe(400);
    expect(invalidBody.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidFilters.status).toBe(400);
    expect(invalidFilters.body.error.code).toBe("VALIDATION_ERROR");

    database.sqlite.close();
  });

  it("filters transactions by search, category, date range, and amount range", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const sessionCookie = await signIn(app);
    const groceries = await createCategory(app, sessionCookie, "Groceries");
    const rent = await createCategory(app, sessionCookie, "Rent");

    await request(app).post("/api/transactions").set("Cookie", sessionCookie).send({
      title: "Farmers market",
      amount: "30.00",
      transactionDate: "2026-05-08",
      categoryId: groceries.id,
      notes: "fresh apples",
      currency: "USD"
    });
    await request(app).post("/api/transactions").set("Cookie", sessionCookie).send({
      title: "Apartment rent",
      amount: "1200.00",
      transactionDate: "2026-05-01",
      categoryId: rent.id,
      notes: "monthly housing",
      currency: "USD"
    });
    await request(app).post("/api/transactions").set("Cookie", sessionCookie).send({
      title: "Late groceries",
      amount: "75.50",
      transactionDate: "2026-06-02",
      categoryId: groceries.id,
      notes: null,
      currency: "USD"
    });

    const response = await request(app)
      .get(`/api/transactions?search=apple&categoryId=${groceries.id}&dateFrom=2026-05-01&dateTo=2026-05-31&amountMin=20&amountMax=50`)
      .set("Cookie", sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body.transactions).toHaveLength(1);
    expect(response.body.transactions[0].title).toBe("Farmers market");

    database.sqlite.close();
  });

  it("hides cross-user transaction and category ids behind not found responses", async () => {
    const database = createTestDatabase();
    const app = createApp({ database });
    const googleSession = await signIn(app, "google");
    const githubSession = await signIn(app, "github");
    const googleCategory = await createCategory(app, googleSession, "Private");
    const githubCategory = await createCategory(app, githubSession, "Shared name");

    const created = await request(app).post("/api/transactions").set("Cookie", googleSession).send({
      title: "Hidden",
      amount: "10",
      transactionDate: "2026-05-08",
      categoryId: googleCategory.id,
      notes: null,
      currency: "USD"
    });
    const createWithForeignCategory = await request(app).post("/api/transactions").set("Cookie", googleSession).send({
      title: "Nope",
      amount: "10",
      transactionDate: "2026-05-08",
      categoryId: githubCategory.id,
      notes: null,
      currency: "USD"
    });
    const renameForeign = await request(app)
      .patch(`/api/transactions/${created.body.transaction.id}`)
      .set("Cookie", githubSession)
      .send({
        title: "Mine",
        amount: "10",
        transactionDate: "2026-05-08",
        categoryId: githubCategory.id,
        notes: null,
        currency: "USD"
      });
    const removeForeign = await request(app)
      .delete(`/api/transactions/${created.body.transaction.id}`)
      .set("Cookie", githubSession);

    expect(createWithForeignCategory.status).toBe(404);
    expect(renameForeign.status).toBe(404);
    expect(removeForeign.status).toBe(404);

    database.sqlite.close();
  });
});
