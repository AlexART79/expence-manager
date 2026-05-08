import type { Dispatch, SetStateAction } from "react";
import { DeleteConfirmationOverlay } from "../components/DeleteConfirmationOverlay";
import type { Category } from "../categories/categoryClient";
import { TransactionForm } from "./TransactionForm";
import type { Transaction } from "./transactionClient";
import type { TransactionFormState } from "./transactionFormState";

export function TransactionRow({
  transaction,
  categories,
  form,
  setForm,
  isEditing,
  isConfirmingDelete,
  isSaving,
  isDeleting,
  onStartEdit,
  onSave,
  onCancelEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  transaction: Transaction;
  categories: Category[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <li
      className={`mode-transition relative grid gap-3 rounded-md border border-white/10 bg-surface px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-none ${
        isEditing ? "md:grid-cols-1 md:items-end" : "md:grid-cols-[1fr_auto] md:items-center"
      }`}
    >
      {isEditing ? (
        <div className="mode-transition">
          <TransactionForm
            categories={categories}
            form={form}
            setForm={setForm}
            labels={{
              title: "Edit transaction title",
              amount: "Edit amount",
              transactionDate: "Edit transaction date",
              category: "Edit category",
              notes: "Edit notes"
            }}
            saveLabel="Save transaction changes"
            isSaving={isSaving}
            onSave={onSave}
            onCancel={onCancelEdit}
          />
        </div>
      ) : (
        <>
          <TransactionSummary transaction={transaction} categories={categories} />
          <TransactionRowActions transaction={transaction} onStartEdit={onStartEdit} onAskDelete={onAskDelete} />
        </>
      )}

      {isConfirmingDelete ? (
        <DeleteConfirmationOverlay
          message={`Are you sure you want to delete transaction ${transaction.title}?`}
          confirmLabel={`Yes, delete ${transaction.title}`}
          isDeleting={isDeleting}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      ) : null}
    </li>
  );
}

function TransactionSummary({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  return (
    <div className="mode-transition min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-semibold text-text">{transaction.title}</p>
        <p className="text-sm font-semibold text-accent-strong">{formatCurrency(transaction.amount)}</p>
        <p className="text-xs text-text-muted">{transaction.transactionDate}</p>
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {categoryNameFor(categories, transaction.categoryId)}
        {transaction.notes ? ` - ${transaction.notes}` : ""}
      </p>
    </div>
  );
}

function TransactionRowActions({
  transaction,
  onStartEdit,
  onAskDelete
}: {
  transaction: Transaction;
  onStartEdit: () => void;
  onAskDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={`Edit ${transaction.title}`}
        onClick={onStartEdit}
      >
        Edit
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-400/30 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={`Delete ${transaction.title}`}
        onClick={onAskDelete}
      >
        Delete
      </button>
    </div>
  );
}

function categoryNameFor(categories: Category[], categoryId: number) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Uncategorized";
}

function formatCurrency(amount: string) {
  return `$${amount}`;
}
