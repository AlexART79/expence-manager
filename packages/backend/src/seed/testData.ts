import { eq } from "drizzle-orm";
import type { DatabaseHandle } from "../db/connection.js";
import { categories, transactions } from "../db/schema/index.js";
import { getTestProviderUser } from "../auth/testProvider.js";
import { upsertUserFromProvider } from "../auth/users.js";
import { createCategory } from "../categories/service.js";
import { createTransaction, type TransactionInput } from "../transactions/service.js";

type Db = DatabaseHandle["db"];

const seededCategoryNames = ["Groceries", "Rent", "Transport", "Coffee", "Entertainment"] as const;

const seededTransactions: Array<Omit<TransactionInput, "categoryId"> & { categoryName: (typeof seededCategoryNames)[number] }> = [
  {
    title: "Weekly groceries",
    amount: "84.32",
    transactionDate: "2026-05-08",
    categoryName: "Groceries",
    notes: "Vegetables, bread, and pantry restock",
    currency: "USD"
  },
  {
    title: "Apartment rent",
    amount: "1200.00",
    transactionDate: "2026-05-01",
    categoryName: "Rent",
    notes: "May rent",
    currency: "USD"
  },
  {
    title: "Metro pass",
    amount: "32.00",
    transactionDate: "2026-05-03",
    categoryName: "Transport",
    notes: "Monthly transit top-up",
    currency: "USD"
  },
  {
    title: "Morning coffee",
    amount: "4.75",
    transactionDate: "2026-05-07",
    categoryName: "Coffee",
    notes: null,
    currency: "USD"
  },
  {
    title: "Movie night",
    amount: "28.50",
    transactionDate: "2026-04-28",
    categoryName: "Entertainment",
    notes: "Tickets and snacks",
    currency: "USD"
  },
  {
    title: "Farmers market",
    amount: "46.10",
    transactionDate: "2026-04-26",
    categoryName: "Groceries",
    notes: "Fresh fruit",
    currency: "USD"
  },
  {
    title: "Taxi from station",
    amount: "18.90",
    transactionDate: "2026-04-24",
    categoryName: "Transport",
    notes: null,
    currency: "USD"
  },
  {
    title: "Concert ticket",
    amount: "65.00",
    transactionDate: "2026-04-15",
    categoryName: "Entertainment",
    notes: "Weekend show",
    currency: "USD"
  }
];

export type SeedTestDataResult = {
  userId: number;
  categoriesCreated: number;
  expensesCreated: number;
};

export function seedTestData(db: Db): SeedTestDataResult {
  const user = upsertUserFromProvider(db, getTestProviderUser("google", "test-google"));

  db.delete(transactions).where(eq(transactions.userId, user.id)).run();
  db.delete(categories).where(eq(categories.userId, user.id)).run();

  const categoryIds = new Map<string, number>();

  for (const name of seededCategoryNames) {
    const category = createCategory(db, user.id, name);
    categoryIds.set(name, category.id);
  }

  for (const { categoryName, ...transaction } of seededTransactions) {
    const categoryId = categoryIds.get(categoryName);

    if (!categoryId) {
      throw new Error(`Missing seeded category: ${categoryName}`);
    }

    createTransaction(db, user.id, {
      ...transaction,
      categoryId
    });
  }

  return {
    userId: user.id,
    categoriesCreated: seededCategoryNames.length,
    expensesCreated: seededTransactions.length
  };
}
