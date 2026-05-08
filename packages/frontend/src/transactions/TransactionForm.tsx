import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../categories/categoryClient";
import type { TransactionFormState } from "./transactionFormState";

type TransactionFormLabels = {
  title: string;
  amount: string;
  transactionDate: string;
  category: string;
  notes: string;
};

export function TransactionForm({
  categories,
  form,
  setForm,
  labels,
  saveLabel,
  isSaving,
  onSave,
  onCancel
}: {
  categories: Category[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  labels: TransactionFormLabels;
  saveLabel: string;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <TransactionFormFields categories={categories} form={form} setForm={setForm} labels={labels} />
      <TransactionFormActions saveLabel={saveLabel} isSaving={isSaving} onSave={onSave} onCancel={onCancel} />
    </>
  );
}

function TransactionFormFields({
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
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.title}
          maxLength={120}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Lunch"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.amount}
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          inputMode="decimal"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          placeholder="12.50"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.transactionDate}
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          type="date"
          value={form.transactionDate}
          onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.category}
        <select
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.categoryId}
          onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
        >
          <option value="">Choose category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        Currency
        <select
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.currency}
          onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as "USD" }))}
        >
          <option value="USD">USD</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text md:col-span-2">
        {labels.notes}
        <textarea
          className="min-h-20 rounded-md border border-white/10 bg-surface-muted px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.notes}
          maxLength={500}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Optional"
        />
      </label>
    </div>
  );
}

function TransactionFormActions({
  saveLabel,
  isSaving,
  onSave,
  onCancel
}: {
  saveLabel: string;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isSaving}
        onClick={onSave}
      >
        {saveLabel}
      </button>
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
