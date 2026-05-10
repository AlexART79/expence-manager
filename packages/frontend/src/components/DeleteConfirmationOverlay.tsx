import { Button } from "./Button";

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
      className="absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-md border border-danger-border bg-danger-surface/95 px-4 py-3 shadow-sm shadow-danger-border/20 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end dark:border-red-400/30 dark:bg-surface/95 dark:shadow-none"
      data-delete-confirmation-overlay
    >
      <p className="min-w-0 text-sm font-medium text-danger dark:text-red-100 sm:mr-auto">{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="border-danger-border bg-danger-strong text-white hover:bg-danger focus:ring-danger-border dark:border-transparent dark:bg-red-300 dark:text-red-950 dark:hover:bg-red-200 dark:focus:ring-red-200"
          variant="primary"
          size="sm"
          isLoading={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Deleting" : confirmLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
