import type { Dispatch, SetStateAction } from "react";
import type { Category } from "../categories/categoryClient";
import { TransactionFormActions } from "./TransactionFormActions";
import { TransactionFormFields } from "./TransactionFormFields";
import type { TransactionFormLabels, TransactionFormState, TransactionFormValidationError } from "./transactionFormState";

export function TransactionForm({
  categories,
  form,
  setForm,
  labels,
  validationError,
  saveLabel,
  isSaving,
  onSave,
  onCancel
}: {
  categories: Category[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  labels: TransactionFormLabels;
  validationError?: TransactionFormValidationError | null;
  saveLabel: string;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <TransactionFormFields
        categories={categories}
        form={form}
        setForm={setForm}
        labels={labels}
        validationError={validationError}
      />
      <TransactionFormActions saveLabel={saveLabel} isSaving={isSaving} onSave={onSave} onCancel={onCancel} />
    </>
  );
}
