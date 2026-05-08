import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../categories/categoryClient";
import { TRANSACTION_COPY, TRANSACTION_CURRENCY, TRANSACTION_LIMITS } from "./transactionConstants";
import type { TransactionFormLabels, TransactionFormState } from "./transactionFormState";

const TRANSACTION_FIELD_CLASS =
  "field-control min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40";
const TRANSACTION_SELECT_CLASS = `${TRANSACTION_FIELD_CLASS} field-select`;
const TRANSACTION_DATE_CLASS = `${TRANSACTION_FIELD_CLASS} field-date`;

export function TransactionFormFields({
  categories,
  form,
  setForm,
  labels
}: {
  categories: Category[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  labels: TransactionFormLabels;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.title}
        <input
          className={TRANSACTION_FIELD_CLASS}
          value={form.title}
          maxLength={TRANSACTION_LIMITS.titleMaxLength}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder={TRANSACTION_COPY.titlePlaceholder}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.amount}
        <input
          className={TRANSACTION_FIELD_CLASS}
          inputMode="decimal"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          placeholder={TRANSACTION_COPY.amountPlaceholder}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.transactionDate}
        <input
          className={`${TRANSACTION_DATE_CLASS} ${form.transactionDate ? "" : "field-control--placeholder"}`}
          type="date"
          value={form.transactionDate}
          onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.category}
        <select
          className={`${TRANSACTION_SELECT_CLASS} ${form.categoryId ? "" : "field-control--placeholder"}`}
          value={form.categoryId}
          onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
        >
          <option value="">{TRANSACTION_COPY.chooseCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {TRANSACTION_COPY.currencyLabel}
        <select
          className={TRANSACTION_SELECT_CLASS}
          value={form.currency}
          onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as typeof TRANSACTION_CURRENCY }))}
        >
          <option value={TRANSACTION_CURRENCY}>{TRANSACTION_CURRENCY}</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text md:col-span-2">
        {labels.notes}
        <textarea
          className="field-control min-h-20 rounded-md border border-white/10 bg-surface-muted px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.notes}
          maxLength={TRANSACTION_LIMITS.notesMaxLength}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder={TRANSACTION_COPY.notesPlaceholder}
        />
      </label>
    </div>
  );
}
