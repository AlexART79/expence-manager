type BudgetValueCardProps = {
  label: string;
  value: string;
  tone?: "normal" | "danger";
  variant?: "default" | "compact";
};

export function BudgetValueCard({ label, value, tone = "normal", variant = "default" }: BudgetValueCardProps) {
  const isCompact = variant === "compact";

  return (
    <div className={`rounded-md border border-line/35 bg-surface-raised dark:border-line/10 dark:bg-surface ${isCompact ? "px-3 py-2" : "p-4"}`}>
      <p
        className={
          isCompact
            ? "text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-text-muted"
            : "text-xs font-semibold uppercase tracking-[0.14em] text-text-muted"
        }
      >
        {label}
      </p>
      <p
        className={`${isCompact ? "mt-1 text-sm" : "mt-2 text-xl"} font-semibold tracking-normal ${
          tone === "danger" ? "text-danger dark:text-red-200" : "text-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
