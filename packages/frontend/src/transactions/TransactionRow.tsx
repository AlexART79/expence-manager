import type { Dispatch, SetStateAction } from "react";
import { DeleteConfirmationOverlay } from "../components/DeleteConfirmationOverlay";
import type { Category } from "../categories/categoryClient";
import { TransactionForm } from "./TransactionForm";
import { TRANSACTION_COPY } from "./transactionConstants";
import type { Transaction } from "./transactionClient";
import type { TransactionFormState, TransactionFormValidationError } from "./transactionFormState";
import { TransactionRowActions } from "./TransactionRowActions";
import { TransactionSummary } from "./TransactionSummary";

export function TransactionRow({
  transaction,
  categories,
  form,
  setForm,
  formError,
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
  formError?: TransactionFormValidationError | null;
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
            labels={TRANSACTION_COPY.editLabels}
            validationError={formError}
            saveLabel={TRANSACTION_COPY.saveTransactionChanges}
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
          message={TRANSACTION_COPY.deleteMessage(transaction.title)}
          confirmLabel={TRANSACTION_COPY.deleteConfirmLabel(transaction.title)}
          isDeleting={isDeleting}
          onConfirm={onConfirmDelete}
          onCancel={onCancelDelete}
        />
      ) : null}
    </li>
  );
}
