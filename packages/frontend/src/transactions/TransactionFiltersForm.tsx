import type { Category } from "../categories/categoryClient";
import type { TransactionFilterFormState } from "./transactionFormState";
import { hasActiveTransactionFilters } from "./transactionFormState";

export function TransactionFiltersForm({
  categories,
  filters,
  isFiltering,
  onFilterChange,
  onClear
}: {
  categories: Category[];
  filters: TransactionFilterFormState;
  isFiltering: boolean;
  onFilterChange: <Key extends keyof TransactionFilterFormState>(
    key: Key,
    value: TransactionFilterFormState[Key]
  ) => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
      <label className="grid gap-2 text-sm font-medium text-text">
        Search transactions
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          placeholder="Title or notes"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        Filter by category
        <select
          className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={filters.categoryId}
          onChange={(event) => onFilterChange("categoryId", event.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        From date
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          type="date"
          value={filters.dateFrom}
          onChange={(event) => onFilterChange("dateFrom", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        To date
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          type="date"
          value={filters.dateTo}
          onChange={(event) => onFilterChange("dateTo", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        Minimum amount
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          inputMode="decimal"
          value={filters.amountMin}
          onChange={(event) => onFilterChange("amountMin", event.target.value)}
          placeholder="0.00"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        Maximum amount
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          inputMode="decimal"
          value={filters.amountMax}
          onChange={(event) => onFilterChange("amountMax", event.target.value)}
          placeholder="999.00"
        />
      </label>
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center self-end rounded-md border border-white/10 px-4 text-sm font-semibold text-text transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isFiltering || !hasActiveTransactionFilters(filters)}
        onClick={onClear}
      >
        Clear filters
      </button>
    </div>
  );
}
