import type { BudgetClient } from "./budgetClient";
import { Button } from "../components/Button";
import { ExpandableSection } from "../components/ExpandableSection";
import { FIELD_CONTROL_CLASS, Field } from "../components/Field";
import { InlineAlert } from "../components/InlineAlert";
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
          <InlineAlert className="mt-4">{dashboard.error}</InlineAlert>
        ) : null
      }
    >
      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(10rem,12rem)_minmax(14rem,1fr)_auto] lg:items-end">
        <Field label={BUDGET_UI_TEXT.budgetMonthLabel}>
          <input
            className={`${FIELD_CONTROL_CLASS} field-date w-full`}
            type="month"
            value={dashboard.selectedMonth}
            onClick={(event) => openNativeDatePicker(event.currentTarget)}
            onChange={(event) => dashboard.setSelectedMonth(event.target.value)}
          />
        </Field>
        <Field label={BUDGET_UI_TEXT.amountLabel} error={dashboard.formError?.message}>
          <input
            className={`${FIELD_CONTROL_CLASS} w-full`}
            inputMode="decimal"
            placeholder={BUDGET_UI_TEXT.amountPlaceholder}
            value={dashboard.form.amount}
            onChange={(event) => dashboard.updateAmount(event.target.value)}
          />
        </Field>
        <Button
          type="button"
          variant="primary"
          isLoading={dashboard.isSaving}
          className="self-start lg:mt-7"
          onClick={dashboard.saveBudget}
        >
          {dashboard.isSaving ? BUDGET_UI_TEXT.saving : BUDGET_UI_TEXT.saveBudget}
        </Button>
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
