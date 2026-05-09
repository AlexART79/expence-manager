import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../categories/categoryClient";
import { SectionState } from "../components/SectionState";
import { TRANSACTION_MESSAGES, TRANSACTION_PENDING_ACTIONS } from "./transactionConstants";
import { TransactionRow } from "./TransactionRow";
import type { Transaction } from "./transactionClient";
import type { TransactionFormState } from "./transactionFormState";
import type { TransactionFormValidationError } from "./transactionFormState";

export function TransactionList({
  categories,
  transactions,
  form,
  setForm,
  formError,
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
  formError?: TransactionFormValidationError | null;
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
    return <SectionState state="loading" title={TRANSACTION_MESSAGES.loading} className="mt-5" />;
  }

  if (transactions.length === 0) {
    return (
      <SectionState
        state="empty"
        title={hasActiveFilters ? TRANSACTION_MESSAGES.emptyFilteredTitle : TRANSACTION_MESSAGES.emptyTitle}
        description={
          hasActiveFilters ? TRANSACTION_MESSAGES.emptyFilteredDescription : TRANSACTION_MESSAGES.emptyDescription
        }
        className="mt-5"
      />
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
          formError={formError}
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
