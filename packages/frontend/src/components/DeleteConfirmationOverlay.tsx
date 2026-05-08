export function DeleteConfirmationOverlay({
  message,
  confirmLabel,
  isDeleting,
  onConfirm,
  onCancel
}: {
  message: string;
  confirmLabel: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-md border border-red-400/30 bg-surface/95 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end"
      data-delete-confirmation-overlay
    >
      <p className="min-w-0 text-sm font-medium text-red-100 sm:mr-auto">{message}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center rounded-md bg-red-300 px-3 text-sm font-semibold text-red-950 transition hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Deleting" : confirmLabel}
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
