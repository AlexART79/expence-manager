import type { Category } from "../categories/categoryClient";
import { TRANSACTION_COPY } from "./transactionConstants";
import type { TransactionFilterFormState } from "./transactionFormState";
import { hasActiveTransactionFilters } from "./transactionFormState";

const FILTER_FIELD_CLASS =
  "field-control min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40";
const SELECT_FIELD_CLASS = `${FILTER_FIELD_CLASS} field-select`;
const DATE_FIELD_CLASS = `${FILTER_FIELD_CLASS} field-date`;

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
        {TRANSACTION_COPY.filterSearchLabel}
        <input
          className={FILTER_FIELD_CLASS}
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          placeholder={TRANSACTION_COPY.filterSearchPlaceholder}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {TRANSACTION_COPY.filterCategoryLabel}
        <select
          className={`${SELECT_FIELD_CLASS} ${filters.categoryId ? "" : "field-control--placeholder"}`}
          value={filters.categoryId}
          onChange={(event) => onFilterChange("categoryId", event.target.value)}
        >
          <option value="">{TRANSACTION_COPY.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {TRANSACTION_COPY.dateFromLabel}
        <input
          className={`${DATE_FIELD_CLASS} ${filters.dateFrom ? "" : "field-control--placeholder"}`}
          type="date"
          value={filters.dateFrom}
          onChange={(event) => onFilterChange("dateFrom", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {TRANSACTION_COPY.dateToLabel}
        <input
          className={`${DATE_FIELD_CLASS} ${filters.dateTo ? "" : "field-control--placeholder"}`}
          type="date"
          value={filters.dateTo}
          onChange={(event) => onFilterChange("dateTo", event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {TRANSACTION_COPY.amountMinLabel}
        <input
          className={FILTER_FIELD_CLASS}
          inputMode="decimal"
          value={filters.amountMin}
          onChange={(event) => onFilterChange("amountMin", event.target.value)}
          placeholder={TRANSACTION_COPY.amountMinPlaceholder}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {TRANSACTION_COPY.amountMaxLabel}
        <input
          className={FILTER_FIELD_CLASS}
          inputMode="decimal"
          value={filters.amountMax}
          onChange={(event) => onFilterChange("amountMax", event.target.value)}
          placeholder={TRANSACTION_COPY.amountMaxPlaceholder}
        />
      </label>
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center self-end rounded-md border border-white/10 px-4 text-sm font-semibold text-text transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isFiltering || !hasActiveTransactionFilters(filters)}
        onClick={onClear}
      >
        {TRANSACTION_COPY.clearFilters}
      </button>
    </div>
  );
}
