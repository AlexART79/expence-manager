import { Button } from "../components/Button";
import { TRANSACTION_COPY } from "./transactionConstants";

export function TransactionFormActions({
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
      <Button
        type="button"
        variant="primary"
        isLoading={isSaving}
        onClick={onSave}
      >
        {saveLabel}
      </Button>
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
      >
        {TRANSACTION_COPY.cancel}
      </Button>
    </div>
  );
}
