import { and, eq } from "drizzle-orm";
import { getBudgetSummary } from "../budgets/service.js";
import type { DatabaseHandle } from "../db/connection.js";
import { budgetAlertStates } from "../db/schema/index.js";

type Db = DatabaseHandle["db"];

export const BUDGET_ALERT_THRESHOLDS = [50, 80, 100] as const;
export type BudgetAlertThreshold = (typeof BUDGET_ALERT_THRESHOLDS)[number];

export type BudgetAlert = {
  month: string;
  threshold: BudgetAlertThreshold;
  usagePercentage: number;
  totalSpent: string;
  budgetAmount: string;
  currency: "USD";
  message: string;
};

export function getCurrentBudgetMonth(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

export function collectNewBudgetAlerts(db: Db, userId: number, month = getCurrentBudgetMonth()): BudgetAlert[] {
  const summary = getBudgetSummary(db, userId, month);

  if (!summary.budget || summary.usagePercentage === null || summary.totalSpentCents <= 0) {
    return [];
  }

  const alerts: BudgetAlert[] = [];

  for (const threshold of BUDGET_ALERT_THRESHOLDS) {
    if (summary.usagePercentage < threshold || hasDeliveredThreshold(db, userId, month, threshold)) {
      continue;
    }

    db.insert(budgetAlertStates)
      .values({
        userId,
        month,
        threshold,
        createdAt: Date.now()
      })
      .run();

    alerts.push({
      month,
      threshold,
      usagePercentage: summary.usagePercentage,
      totalSpent: summary.totalSpent,
      budgetAmount: summary.budget.amount,
      currency: summary.currency,
      message: `You have used ${threshold}% of your ${formatMonthName(month)} budget.`
    });
  }

  return alerts;
}

function hasDeliveredThreshold(db: Db, userId: number, month: string, threshold: BudgetAlertThreshold) {
  return Boolean(
    db
      .select()
      .from(budgetAlertStates)
      .where(
        and(
          eq(budgetAlertStates.userId, userId),
          eq(budgetAlertStates.month, month),
          eq(budgetAlertStates.threshold, threshold)
        )
      )
      .get()
  );
}

function formatMonthName(month: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00.000Z`)
  );
}
