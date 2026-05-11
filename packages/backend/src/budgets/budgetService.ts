import { eq, and, like } from 'drizzle-orm';
import { monthlyBudgets, transactions } from '../db/schema/index.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

export interface MonthlyBudget {
  id: number;
  userId: number;
  month: string;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetSummary {
  month: string;
  budgetAmount: number | null;
  currency: string;
  totalSpent: number;
  remaining: number | null;
  usagePercent: number | null;
}

export class BudgetNotFoundError extends Error {
  constructor() {
    super('Budget not found');
    this.name = 'BudgetNotFoundError';
  }
}

function findBudget(db: Db, userId: number, month: string): MonthlyBudget | null {
  return (
    db
      .select()
      .from(monthlyBudgets)
      .where(and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)))
      .get() ?? null
  );
}

export function getBudget(db: Db, userId: number, month: string): MonthlyBudget {
  const budget = findBudget(db, userId, month);
  if (!budget) throw new BudgetNotFoundError();
  return budget;
}

export function setBudget(
  db: Db,
  userId: number,
  month: string,
  amount: number,
  currency: string,
): MonthlyBudget {
  const existing = findBudget(db, userId, month);

  if (existing) {
    const [updated] = db
      .update(monthlyBudgets)
      .set({ amount, currency, updatedAt: new Date() })
      .where(and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)))
      .returning()
      .all();
    if (!updated) throw new Error('Update returned no row');
    return updated;
  }

  const [inserted] = db
    .insert(monthlyBudgets)
    .values({ userId, month, amount, currency })
    .returning()
    .all();
  if (!inserted) throw new Error('Insert returned no row');
  return inserted;
}

export function getBudgetSummary(db: Db, userId: number, month: string): BudgetSummary {
  const budget = findBudget(db, userId, month);

  const txns = db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        like(transactions.transactionDate, `${month}-%`),
      ),
    )
    .all();

  const totalSpent = txns.reduce((sum, tx) => sum + tx.amount, 0);

  if (!budget) {
    return {
      month,
      budgetAmount: null,
      currency: 'USD',
      totalSpent,
      remaining: null,
      usagePercent: null,
    };
  }

  return {
    month,
    budgetAmount: budget.amount,
    currency: budget.currency,
    totalSpent,
    remaining: budget.amount - totalSpent,
    usagePercent: (totalSpent / budget.amount) * 100,
  };
}
