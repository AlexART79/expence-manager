import { formatBudgetCurrency, formatBudgetMonth } from "../budgets/budgetDisplay";
import type { BudgetAlert } from "./budgetAlertClient";

export function BudgetAlertBanners({
  alerts,
  onDismiss
}: {
  alerts: BudgetAlert[];
  onDismiss: (alert: BudgetAlert) => void;
}) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3" aria-live="polite">
      {alerts.map((alert) => (
        <div
          key={`${alert.month}-${alert.threshold}`}
          className="mode-transition rounded-md border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-amber-50 shadow-lg shadow-black/10"
          role="status"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-200">
                {formatBudgetMonth(alert.month)} threshold
              </p>
              <p className="mt-1 text-sm font-semibold text-text">{alert.message}</p>
              <p className="mt-1 text-xs text-text-muted">
                {formatBudgetCurrency(alert.totalSpent)} spent of {formatBudgetCurrency(alert.budgetAmount)}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Dismiss ${alert.threshold}% budget alert`}
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-amber-200/30 px-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
              onClick={() => onDismiss(alert)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
