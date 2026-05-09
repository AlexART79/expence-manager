import { BudgetValueCard } from "./BudgetValueCard";

type BudgetHeaderSummaryProps = {
  isExpanded: boolean;
  monthBudgetLabel: string;
  budgetValue: string;
  remainingLabel: string;
  remainingValue: string;
  remainingTone?: "normal" | "danger";
};

export function BudgetHeaderSummary({
  isExpanded,
  monthBudgetLabel,
  budgetValue,
  remainingLabel,
  remainingValue,
  remainingTone = "normal"
}: BudgetHeaderSummaryProps) {
  return (
    <div
      className={`grid gap-2 transition duration-150 ease-out motion-reduce:transition-none sm:grid-cols-2 ${
        isExpanded ? "-translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <BudgetValueCard label={monthBudgetLabel} value={budgetValue} variant="compact" />
      <BudgetValueCard label={remainingLabel} value={remainingValue} tone={remainingTone} variant="compact" />
    </div>
  );
}
