import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../categories/categoryClient";
import { TRANSACTION_MESSAGES, TRANSACTION_PENDING_ACTIONS } from "./transactionConstants";
import { TransactionRow } from "./TransactionRow";
import type { Transaction } from "./transactionClient";
import type { TransactionFormState } from "./transactionFormState";

export function TransactionList({
  categories,
  transactions,
  form,
  setForm,
  editingTransaction,
  deleteConfirmationId,
  isLoading,
  hasActiveFilters,
  pendingAction,
  onStartEdit,
  onSave,
  onCancelEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  categories: Category[];
  transactions: Transaction[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  editingTransaction: Transaction | null;
  deleteConfirmationId: number | null;
  isLoading: boolean;
  hasActiveFilters: boolean;
  pendingAction: string | null;
  onStartEdit: (transaction: Transaction) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onAskDelete: (transactionId: number) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (transactionId: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-5 rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted" role="status">
        {TRANSACTION_MESSAGES.loading}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="mt-5 rounded-md border border-dashed border-white/15 bg-surface px-4 py-6">
        <p className="text-sm font-semibold text-text">
          {hasActiveFilters ? TRANSACTION_MESSAGES.emptyFilteredTitle : TRANSACTION_MESSAGES.emptyTitle}
        </p>
        <p className="mt-1 text-sm text-text-muted">
          {hasActiveFilters ? TRANSACTION_MESSAGES.emptyFilteredDescription : TRANSACTION_MESSAGES.emptyDescription}
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-5 grid gap-2">
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          categories={categories}
          form={form}
          setForm={setForm}
          isEditing={editingTransaction?.id === transaction.id}
          isConfirmingDelete={deleteConfirmationId === transaction.id}
          isSaving={pendingAction === TRANSACTION_PENDING_ACTIONS.update(transaction.id)}
          isDeleting={pendingAction === TRANSACTION_PENDING_ACTIONS.delete(transaction.id)}
          onStartEdit={() => onStartEdit(transaction)}
          onSave={onSave}
          onCancelEdit={onCancelEdit}
          onAskDelete={() => onAskDelete(transaction.id)}
          onCancelDelete={onCancelDelete}
          onConfirmDelete={() => onConfirmDelete(transaction.id)}
        />
      ))}
    </ul>
  );
}
