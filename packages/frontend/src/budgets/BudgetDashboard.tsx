import type { BudgetClient } from "./budgetClient";
import { ExpandableSection } from "../components/ExpandableSection";
import { BUDGET_DISPLAY_FORMAT, BUDGET_UI_TEXT } from "./budgetConstants";
import { formatBudgetCurrency, formatBudgetMonth, formatUsagePercentage } from "./budgetDisplay";
import { BudgetHeaderSummary } from "./BudgetHeaderSummary";
import { BudgetMetricsGrid } from "./BudgetMetricsGrid";
import { BudgetUsagePanel } from "./BudgetUsagePanel";
import { openNativeDatePicker } from "../components/nativeDatePicker";
import { useBudgetDashboard } from "./useBudgetDashboard";
import { useBudgetPanel } from "./useBudgetPanel";

export function BudgetDashboard({ budgetClient, refreshKey }: { budgetClient: BudgetClient; refreshKey: number }) {
  const dashboard = useBudgetDashboard(budgetClient, refreshKey);
  const panel = useBudgetPanel();
  const summary = dashboard.summary;
  const usage = summary?.usagePercentage ?? null;
  const isOverBudget = (summary?.remainingCents ?? 0) < 0;
  const budgetValue = dashboard.isLoading
    ? BUDGET_UI_TEXT.loading
    : summary?.budget
      ? formatBudgetCurrency(summary.budget.amount)
      : BUDGET_UI_TEXT.noBudgetSet;
  const remainingValue = dashboard.isLoading ? BUDGET_UI_TEXT.loading : formatBudgetCurrency(summary?.remaining ?? null);
  const usageValue = formatUsagePercentage(usage);
  const budgetMetrics = [
    {
      label: BUDGET_UI_TEXT.spent,
      value: formatBudgetCurrency(summary?.totalSpent ?? BUDGET_DISPLAY_FORMAT.defaultAmount)
    },
    {
      label: BUDGET_UI_TEXT.budget,
      value: budgetValue
    },
    {
      label: BUDGET_UI_TEXT.remaining,
      value: remainingValue,
      tone: isOverBudget ? "danger" : "normal"
    },
    {
      label: BUDGET_UI_TEXT.usage,
      value: usageValue,
      tone: isOverBudget ? "danger" : "normal"
    }
  ] as const;

  return (
    <ExpandableSection
      eyebrow={BUDGET_UI_TEXT.eyebrow}
      title={BUDGET_UI_TEXT.heading}
      panelId={BUDGET_UI_TEXT.panelContentId}
      isExpanded={panel.isExpanded}
      expandLabel={BUDGET_UI_TEXT.expandBudget}
      collapseLabel={BUDGET_UI_TEXT.collapseBudget}
      onToggle={panel.toggleExpanded}
      headerClassName="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      actionsClassName="flex min-h-14 flex-col items-end justify-center gap-3 sm:flex-row sm:items-center sm:self-end"
      actions={
        panel.showHeaderSummary ? (
          <BudgetHeaderSummary
            isExpanded={panel.isExpanded}
            monthBudgetLabel={`${formatBudgetMonth(dashboard.selectedMonth)} ${BUDGET_UI_TEXT.budget.toLowerCase()}`}
            budgetValue={budgetValue}
            remainingLabel={BUDGET_UI_TEXT.remaining}
            remainingValue={remainingValue}
            remainingTone={isOverBudget ? "danger" : "normal"}
          />
        ) : null
      }
      status={
        dashboard.error ? (
          <p
            className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            {dashboard.error}
          </p>
        ) : null
      }
    >
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(10rem,12rem)_minmax(14rem,1fr)_auto] lg:items-end">
        <label className="grid gap-2 text-sm font-medium text-text">
          {BUDGET_UI_TEXT.budgetMonthLabel}
          <input
            className="field-control field-date min-h-10 w-full rounded-md border border-white/10 bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            type="month"
            value={dashboard.selectedMonth}
            onClick={(event) => openNativeDatePicker(event.currentTarget)}
            onChange={(event) => dashboard.setSelectedMonth(event.target.value)}
          />
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-medium text-text">
          {BUDGET_UI_TEXT.amountLabel}
          <input
            className="field-control min-h-10 w-full rounded-md border border-white/10 bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            inputMode="decimal"
            placeholder={BUDGET_UI_TEXT.amountPlaceholder}
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
          {dashboard.isSaving ? BUDGET_UI_TEXT.saving : BUDGET_UI_TEXT.saveBudget}
        </button>
      </div>

      <BudgetMetricsGrid metrics={budgetMetrics} />

      <BudgetUsagePanel
        usageLabel={BUDGET_UI_TEXT.monthlyUsage}
        usageValue={usageValue}
        usagePercentage={usage}
        isLoading={dashboard.isLoading}
        hasBudget={Boolean(summary?.budget)}
        isOverBudget={isOverBudget}
      />
    </ExpandableSection>
  );
}
