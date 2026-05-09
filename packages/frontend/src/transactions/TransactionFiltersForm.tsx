import type { Category } from "../categories/categoryClient";
import { Button } from "../components/Button";
import { FIELD_CONTROL_CLASS, Field } from "../components/Field";
import { openNativeDatePicker } from "../components/nativeDatePicker";
import { TRANSACTION_COPY } from "./transactionConstants";
import type { TransactionFilterFormState } from "./transactionFormState";
import { hasActiveTransactionFilters } from "./transactionFormState";

const SELECT_FIELD_CLASS = `${FIELD_CONTROL_CLASS} field-select`;
const DATE_FIELD_CLASS = `${FIELD_CONTROL_CLASS} field-date`;

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
      <Field label={TRANSACTION_COPY.filterSearchLabel}>
        <input
          className={FIELD_CONTROL_CLASS}
          value={filters.search}
          onChange={(event) => onFilterChange("search", event.target.value)}
          placeholder={TRANSACTION_COPY.filterSearchPlaceholder}
        />
      </Field>
      <Field label={TRANSACTION_COPY.filterCategoryLabel}>
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
      </Field>
      <Field label={TRANSACTION_COPY.dateFromLabel}>
        <input
          className={`${DATE_FIELD_CLASS} ${filters.dateFrom ? "" : "field-control--placeholder"}`}
          type="date"
          value={filters.dateFrom}
          onClick={(event) => openNativeDatePicker(event.currentTarget)}
          onChange={(event) => onFilterChange("dateFrom", event.target.value)}
        />
      </Field>
      <Field label={TRANSACTION_COPY.dateToLabel}>
        <input
          className={`${DATE_FIELD_CLASS} ${filters.dateTo ? "" : "field-control--placeholder"}`}
          type="date"
          value={filters.dateTo}
          onClick={(event) => openNativeDatePicker(event.currentTarget)}
          onChange={(event) => onFilterChange("dateTo", event.target.value)}
        />
      </Field>
      <Field label={TRANSACTION_COPY.amountMinLabel}>
        <input
          className={FIELD_CONTROL_CLASS}
          inputMode="decimal"
          value={filters.amountMin}
          onChange={(event) => onFilterChange("amountMin", event.target.value)}
          placeholder={TRANSACTION_COPY.amountMinPlaceholder}
        />
      </Field>
      <Field label={TRANSACTION_COPY.amountMaxLabel}>
        <input
          className={FIELD_CONTROL_CLASS}
          inputMode="decimal"
          value={filters.amountMax}
          onChange={(event) => onFilterChange("amountMax", event.target.value)}
          placeholder={TRANSACTION_COPY.amountMaxPlaceholder}
        />
      </Field>
      <Button
        type="button"
        className="self-start lg:mt-7"
        variant="secondary"
        disabled={isFiltering || !hasActiveTransactionFilters(filters)}
        onClick={onClear}
      >
        {TRANSACTION_COPY.clearFilters}
      </Button>
    </div>
  );
}
