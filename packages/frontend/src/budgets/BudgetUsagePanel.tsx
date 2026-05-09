import { BUDGET_UI_TEXT } from "./budgetConstants";
import { getUsageBarWidth } from "./budgetDisplay";

type BudgetUsagePanelProps = {
  usageLabel: string;
  usageValue: string;
  usagePercentage: number | null;
  isLoading: boolean;
  hasBudget: boolean;
  isOverBudget: boolean;
};

export function BudgetUsagePanel({
  usageLabel,
  usageValue,
  usagePercentage,
  isLoading,
  hasBudget,
  isOverBudget
}: BudgetUsagePanelProps) {
  return (
    <div className="mt-5 rounded-md border border-white/10 bg-surface p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-text">{usageLabel}</span>
        <span className={isOverBudget ? "font-semibold text-red-200" : "font-semibold text-accent-strong"}>
          {usageValue}
        </span>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-3 rounded-full transition-all ${isOverBudget ? "bg-red-300" : "bg-accent"}`}
          style={{ width: getUsageBarWidth(usagePercentage) }}
        />
      </div>
      {!isLoading && !hasBudget ? <p className="mt-3 text-sm text-text-muted">{BUDGET_UI_TEXT.noBudgetSet}</p> : null}
    </div>
  );
}
