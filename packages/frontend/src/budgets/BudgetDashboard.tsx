import { useEffect, useState } from "react";
import type { BudgetClient } from "./budgetClient";
import { formatBudgetCurrency, formatBudgetMonth, formatUsagePercentage, getUsageBarWidth } from "./budgetDisplay";
import { useBudgetDashboard } from "./useBudgetDashboard";

const BUDGET_PANEL_CONTENT_ID = "budget-panel-content";

export function BudgetDashboard({ budgetClient, refreshKey }: { budgetClient: BudgetClient; refreshKey: number }) {
  const dashboard = useBudgetDashboard(budgetClient, refreshKey);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHeaderSummary, setShowHeaderSummary] = useState(true);
  const summary = dashboard.summary;
  const usage = summary?.usagePercentage ?? null;
  const isOverBudget = (summary?.remainingCents ?? 0) < 0;
  const budgetValue = dashboard.isLoading
    ? "Loading..."
    : summary?.budget
      ? formatBudgetCurrency(summary.budget.amount)
      : "No budget set";
  const remainingValue = dashboard.isLoading ? "Loading..." : formatBudgetCurrency(summary?.remaining ?? null);

  useEffect(() => {
    if (!isExpanded) {
      setShowHeaderSummary(true);
      return;
    }

    const hideSummary = window.setTimeout(() => setShowHeaderSummary(false), 160);

    return () => window.clearTimeout(hideSummary);
  }, [isExpanded]);

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">Budget guardrails</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">Monthly budget</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-end">
          {showHeaderSummary ? (
            <div
              className={`grid gap-2 transition duration-150 ease-out motion-reduce:transition-none sm:grid-cols-2 ${
                isExpanded ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              <BudgetSummaryPill label={`${formatBudgetMonth(dashboard.selectedMonth)} budget`} value={budgetValue} />
              <BudgetSummaryPill
                label="Remaining"
                value={remainingValue}
                tone={isOverBudget ? "danger" : "normal"}
              />
            </div>
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-surface text-text transition hover:border-accent/60 hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            aria-label={isExpanded ? "Collapse budget" : "Expand budget"}
            aria-expanded={isExpanded}
            aria-controls={BUDGET_PANEL_CONTENT_ID}
            onClick={() => setIsExpanded((current) => !current)}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {dashboard.error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {dashboard.error}
        </p>
      ) : null}

      {isExpanded ? (
        <div id={BUDGET_PANEL_CONTENT_ID} className="mode-transition">
          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(10rem,12rem)_minmax(14rem,1fr)_auto] lg:items-end">
            <label className="grid gap-2 text-sm font-medium text-text">
              Budget month
              <input
                className="field-control field-date min-h-10 w-full rounded-md border border-white/10 bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                type="month"
                value={dashboard.selectedMonth}
                onChange={(event) => dashboard.setSelectedMonth(event.target.value)}
              />
            </label>
            <label className="grid min-w-0 gap-2 text-sm font-medium text-text">
              Monthly budget amount
              <input
                className="field-control min-h-10 w-full rounded-md border border-white/10 bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                inputMode="decimal"
                placeholder="500.00"
                value={dashboard.form.amount}
                onChange={(event) => dashboard.updateAmount(event.target.value)}
              />
            </label>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
              disabled={dashboard.isSaving}
              onClick={dashboard.saveBudget}
            >
              {dashboard.isSaving ? "Saving..." : "Save budget"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <BudgetMetric label="Spent" value={formatBudgetCurrency(summary?.totalSpent ?? "0.00")} />
            <BudgetMetric label="Budget" value={budgetValue} />
            <BudgetMetric label="Remaining" value={remainingValue} tone={isOverBudget ? "danger" : "normal"} />
            <BudgetMetric label="Usage" value={formatUsagePercentage(usage)} tone={isOverBudget ? "danger" : "normal"} />
          </div>

          <div className="mt-5 rounded-md border border-white/10 bg-surface p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-text">Monthly usage</span>
              <span className={isOverBudget ? "font-semibold text-red-200" : "font-semibold text-accent-strong"}>
                {formatUsagePercentage(usage)}
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted">
              <div
                className={`h-3 rounded-full transition-all ${isOverBudget ? "bg-red-300" : "bg-accent"}`}
                style={{ width: getUsageBarWidth(usage) }}
              />
            </div>
            {!dashboard.isLoading && !summary?.budget ? (
              <p className="mt-3 text-sm text-text-muted">No budget set</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function BudgetSummaryPill({
  label,
  value,
  tone = "normal"
}: {
  label: string;
  value: string;
  tone?: "normal" | "danger";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-surface px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={`mt-1 text-sm font-semibold tracking-normal ${tone === "danger" ? "text-red-200" : "text-text"}`}>
        {value}
      </p>
    </div>
  );
}

function BudgetMetric({
  label,
  value,
  tone = "normal"
}: {
  label: string;
  value: string;
  tone?: "normal" | "danger";
}) {
  return (
    <div className="rounded-md border border-white/10 bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-2 text-xl font-semibold tracking-normal ${tone === "danger" ? "text-red-200" : "text-text"}`}>
        {value}
      </p>
    </div>
  );
}
