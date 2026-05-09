import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../categories/categoryClient";
import { FIELD_CONTROL_MUTED_CLASS, Field } from "../components/Field";
import { openNativeDatePicker } from "../components/nativeDatePicker";
import { TRANSACTION_COPY, TRANSACTION_CURRENCY, TRANSACTION_LIMITS } from "./transactionConstants";
import type { TransactionFormLabels, TransactionFormState, TransactionFormValidationError } from "./transactionFormState";

const TRANSACTION_SELECT_CLASS = `${FIELD_CONTROL_MUTED_CLASS} field-select`;
const TRANSACTION_DATE_CLASS = `${FIELD_CONTROL_MUTED_CLASS} field-date`;

export function TransactionFormFields({
  categories,
  form,
  setForm,
  labels,
  validationError
}: {
  categories: Category[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  labels: TransactionFormLabels;
  validationError?: TransactionFormValidationError | null;
}) {
  const getError = (field: TransactionFormValidationError["field"]) =>
    validationError?.field === field ? validationError.message : null;

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label={labels.title} error={getError("title")}>
        <input
          className={FIELD_CONTROL_MUTED_CLASS}
          value={form.title}
          maxLength={TRANSACTION_LIMITS.titleMaxLength}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder={TRANSACTION_COPY.titlePlaceholder}
        />
      </Field>
      <Field label={labels.amount} error={getError("amount")}>
        <input
          className={FIELD_CONTROL_MUTED_CLASS}
          inputMode="decimal"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          placeholder={TRANSACTION_COPY.amountPlaceholder}
        />
      </Field>
      <Field label={labels.transactionDate} error={getError("transactionDate")}>
        <input
          className={`${TRANSACTION_DATE_CLASS} ${form.transactionDate ? "" : "field-control--placeholder"}`}
          type="date"
          value={form.transactionDate}
          onClick={(event) => openNativeDatePicker(event.currentTarget)}
          onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
        />
      </Field>
      <Field label={labels.category} error={getError("categoryId")}>
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
      </Field>
      <Field label={TRANSACTION_COPY.currencyLabel} error={getError("currency")}>
        <select
          className={TRANSACTION_SELECT_CLASS}
          value={form.currency}
          onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as typeof TRANSACTION_CURRENCY }))}
        >
          <option value={TRANSACTION_CURRENCY}>{TRANSACTION_CURRENCY}</option>
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label={labels.notes} error={getError("notes")}>
          <textarea
            className={`${FIELD_CONTROL_MUTED_CLASS} min-h-20 py-2`}
            value={form.notes}
            maxLength={TRANSACTION_LIMITS.notesMaxLength}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder={TRANSACTION_COPY.notesPlaceholder}
          />
        </Field>
      </div>
    </div>
  );
}
