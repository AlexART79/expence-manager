import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { budgetAlertStates, users } from "../db/schema/index.js";
import { upsertBudget } from "../budgets/service.js";
import { createCategory } from "../categories/service.js";
import { createTransaction, updateTransaction } from "../transactions/service.js";
import { createTestDatabase } from "../test/helpers/db.js";
import { collectNewBudgetAlerts } from "./service.js";

describe("budget alert service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-09T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates 50, 80, and 100 percent alerts once per user and month", () => {
    const database = createTestDatabase();
    createUser(database.db, 1);
    const category = createCategory(database.db, 1, "Food");

    upsertBudget(database.db, 1, "2026-05", { amount: "100.00", currency: "USD" });
    createTransaction(database.db, 1, {
      title: "Groceries",
      amount: "50.00",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: null,
      currency: "USD"
    });

    expect(collectNewBudgetAlerts(database.db, 1, "2026-05").map((alert) => alert.threshold)).toEqual([50]);
    expect(collectNewBudgetAlerts(database.db, 1, "2026-05")).toEqual([]);

    createTransaction(database.db, 1, {
      title: "Dinner",
      amount: "30.00",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: null,
      currency: "USD"
    });
    expect(collectNewBudgetAlerts(database.db, 1, "2026-05").map((alert) => alert.threshold)).toEqual([80]);

    createTransaction(database.db, 1, {
      title: "Rent",
      amount: "20.00",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: null,
      currency: "USD"
    });
    expect(collectNewBudgetAlerts(database.db, 1, "2026-05").map((alert) => alert.threshold)).toEqual([100]);

    const states = database.db.select().from(budgetAlertStates).where(eq(budgetAlertStates.userId, 1)).all();
    expect(states.map((state) => state.threshold)).toEqual([50, 80, 100]);

    database.sqlite.close();
  });

  it("does not emit without a current-month budget or after spending drops below a delivered threshold", () => {
    const database = createTestDatabase();
    createUser(database.db, 1);
    const category = createCategory(database.db, 1, "Food");

    createTransaction(database.db, 1, {
      title: "No budget purchase",
      amount: "75.00",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: null,
      currency: "USD"
    });

    expect(collectNewBudgetAlerts(database.db, 1, "2026-05")).toEqual([]);

    upsertBudget(database.db, 1, "2026-05", { amount: "100.00", currency: "USD" });
    expect(collectNewBudgetAlerts(database.db, 1, "2026-05").map((alert) => alert.threshold)).toEqual([50]);

    const transaction = createTransaction(database.db, 1, {
      title: "Adjustable",
      amount: "10.00",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: null,
      currency: "USD"
    });
    updateTransaction(database.db, 1, transaction.id, {
      title: "Adjusted",
      amount: "1.00",
      transactionDate: "2026-05-09",
      categoryId: category.id,
      notes: null,
      currency: "USD"
    });

    expect(collectNewBudgetAlerts(database.db, 1, "2026-05")).toEqual([]);

    database.sqlite.close();
  });
});

function createUser(db: ReturnType<typeof createTestDatabase>["db"], id: number) {
  db.insert(users)
    .values({
      id,
      provider: "google",
      providerUserId: `test-${id}`,
      email: `user-${id}@example.com`,
      displayName: `User ${id}`,
      avatarUrl: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    .run();
}
