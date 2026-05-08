import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users, categories, transactions } from "../db/schema/index.js";
import { createTestDatabase } from "../test/helpers/db.js";
import { seedTestData } from "./testData.js";

describe("seedTestData", () => {
  it("replaces categories and expenses for the Google test user", () => {
    const database = createTestDatabase();

    const first = seedTestData(database.db);
    const second = seedTestData(database.db);

    const user = database.db.select().from(users).where(eq(users.providerUserId, "google-test-user")).get();
    const seededCategories = database.db.select().from(categories).where(eq(categories.userId, user!.id)).all();
    const seededTransactions = database.db.select().from(transactions).where(eq(transactions.userId, user!.id)).all();

    expect(user).toMatchObject({
      provider: "google",
      email: "google.user@example.com",
      displayName: "Google Test User"
    });
    expect(first).toEqual(second);
    expect(seededCategories.map((category) => category.name).sort()).toEqual([
      "Coffee",
      "Entertainment",
      "Groceries",
      "Rent",
      "Transport"
    ]);
    expect(seededTransactions).toHaveLength(8);
    expect(seededTransactions.map((transaction) => transaction.title)).toContain("Weekly groceries");

    database.sqlite.close();
  });
});
