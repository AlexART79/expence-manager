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
        {TRANSACTION_COPY.cancel}
      </button>
    </div>
  );
}
