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
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={TRANSACTION_COPY.editAriaLabel(transaction.title)}
        onClick={onStartEdit}
      >
        {TRANSACTION_COPY.edit}
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-400/30 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={TRANSACTION_COPY.deleteAriaLabel(transaction.title)}
        onClick={onAskDelete}
      >
        {TRANSACTION_COPY.delete}
      </button>
    </div>
  );
}
