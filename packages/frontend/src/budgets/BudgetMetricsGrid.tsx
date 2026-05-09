import { BudgetValueCard } from "./BudgetValueCard";

type BudgetMetricItem = {
  label: string;
  value: string;
  tone?: "normal" | "danger";
};

type BudgetMetricsGridProps = {
  metrics: readonly BudgetMetricItem[];
};

export function BudgetMetricsGrid({ metrics }: BudgetMetricsGridProps) {
  return (
    <div className="mt-5 grid gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <BudgetValueCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
      ))}
    </div>
  );
}
