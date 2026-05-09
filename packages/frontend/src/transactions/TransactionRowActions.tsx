import { Button } from "../components/Button";
import { TRANSACTION_COPY } from "./transactionConstants";
import type { Transaction } from "./transactionClient";

export function TransactionRowActions({
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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={TRANSACTION_COPY.editAriaLabel(transaction.title)}
        onClick={onStartEdit}
      >
        {TRANSACTION_COPY.edit}
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        aria-label={TRANSACTION_COPY.deleteAriaLabel(transaction.title)}
        onClick={onAskDelete}
      >
        {TRANSACTION_COPY.delete}
      </Button>
    </div>
  );
}
