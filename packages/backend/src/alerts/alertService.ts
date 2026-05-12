import { eq, and, like } from 'drizzle-orm';
import { budgetAlerts, monthlyBudgets, transactions } from '../db/schema/index.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

const THRESHOLDS = [50, 80, 100] as const;

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Error && (err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE';
}

function getAlertedThresholds(db: Db, userId: number, month: string): Set<number> {
  const rows = db
    .select({ threshold: budgetAlerts.threshold })
    .from(budgetAlerts)
    .where(and(eq(budgetAlerts.userId, userId), eq(budgetAlerts.month, month)))
    .all();
  return new Set(rows.map((r) => r.threshold));
}

function markAlerted(db: Db, userId: number, month: string, threshold: number): void {
  try {
    db.insert(budgetAlerts).values({ userId, month, threshold }).run();
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
  }
}

function computeUsagePercent(db: Db, userId: number, month: string): number | null {
  const budget = db
    .select({ amount: monthlyBudgets.amount })
    .from(monthlyBudgets)
    .where(and(eq(monthlyBudgets.userId, userId), eq(monthlyBudgets.month, month)))
    .get();

  if (!budget) return null;

  const txns = db
    .select({ amount: transactions.amount })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), like(transactions.transactionDate, `${month}-%`)))
    .all();

  const totalSpent = txns.reduce((sum, tx) => sum + tx.amount, 0);
  return (totalSpent / budget.amount) * 100;
}

export function checkAndDispatchAlerts(
  db: Db,
  userId: number,
  month: string,
  dispatch: (threshold: number, usagePercent: number) => void,
): void {
  const usagePercent = computeUsagePercent(db, userId, month);
  if (usagePercent === null) return;

  const alerted = getAlertedThresholds(db, userId, month);

  for (const threshold of THRESHOLDS) {
    if (usagePercent >= threshold && !alerted.has(threshold)) {
      markAlerted(db, userId, month, threshold);
      dispatch(threshold, usagePercent);
    }
  }
}
