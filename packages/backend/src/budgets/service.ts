import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { DatabaseHandle } from "../db/connection.js";
import { monthlyBudgets, transactions } from "../db/schema/index.js";

type Db = DatabaseHandle["db"];

export type BudgetInput = {
  amount: string;
  currency: "USD";
};

export type Budget = {
  id: number;
  month: string;
  amount: string;
  amountCents: number;
  currency: "USD";
  createdAt: number;
  updatedAt: number;
};

export type BudgetSummary = {
  month: string;
  budget: Budget | null;
  totalSpent: string;
  totalSpentCents: number;
  remaining: string | null;
  remainingCents: number | null;
  usagePercentage: number | null;
  currency: "USD";
};

export function getBudget(db: Db, userId: number, month: string): Budget | null {
  const budget = db
    .select()
    .from(monthlyBudgets)
    .where(and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)))
    .get();

  return budget ? toBudget(budget) : null;
}

export function upsertBudget(db: Db, userId: number, month: string, input: BudgetInput): Budget {
  const existing = db
    .select()
    .from(monthlyBudgets)
    .where(and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)))
    .get();
  const now = Date.now();
  const amountCents = amountToCents(input.amount);

  if (existing) {
    const updated = db
      .update(monthlyBudgets)
      .set({
        amountCents,
        currency: input.currency,
        updatedAt: now
      })
      .where(and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)))
      .returning()
      .get();

    return toBudget(updated);
  }

  const created = db
    .insert(monthlyBudgets)
    .values({
      userId,
      month,
      amountCents,
      currency: input.currency,
      createdAt: now,
      updatedAt: now
    })
    .returning()
    .get();

  return toBudget(created);
}

export function getBudgetSummary(db: Db, userId: number, month: string): BudgetSummary {
  const budget = getBudget(db, userId, month);
  const totalSpentCents = getTotalSpentCents(db, userId, month);
  const remainingCents = budget ? budget.amountCents - totalSpentCents : null;
  const usagePercentage = budget ? roundPercentage((totalSpentCents / budget.amountCents) * 100) : null;

  return {
    month,
    budget,
    totalSpent: centsToAmount(totalSpentCents),
    totalSpentCents,
    remaining: remainingCents === null ? null : centsToAmount(remainingCents),
    remainingCents,
    usagePercentage,
    currency: "USD"
  };
}

function getTotalSpentCents(db: Db, userId: number, month: string) {
  const range = getMonthRange(month);
  const row = db
    .select({
      total: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, range.start),
        lt(transactions.transactionDate, range.end)
      )
    )
    .get();

  return Number(row?.total ?? 0);
}

function getMonthRange(month: string) {
  const parts = month.split("-");
  const year = Number(parts[0]);
  const monthNumber = Number(parts[1]);
  const start = `${month}-01`;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return { start, end };
}

function amountToCents(amount: string) {
  const [whole, decimal = ""] = amount.split(".");
  const cents = `${decimal}00`.slice(0, 2);
  return Number(whole) * 100 + Number(cents);
}

function centsToAmount(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

function roundPercentage(value: number) {
  return Math.round(value * 100) / 100;
}

function toBudget(budget: typeof monthlyBudgets.$inferSelect): Budget {
  return {
    id: budget.id,
    month: budget.month,
    amount: centsToAmount(budget.amountCents),
    amountCents: budget.amountCents,
    currency: budget.currency,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt
  };
}
