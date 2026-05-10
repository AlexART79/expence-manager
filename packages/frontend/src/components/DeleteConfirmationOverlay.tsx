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
      className="absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-md border border-danger-border bg-danger-surface/95 px-4 py-3 shadow-sm shadow-danger-border/20 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end dark:border-danger-border/50 dark:bg-danger-surface/80"
      data-delete-confirmation-overlay
    >
      <p className="min-w-0 text-sm font-medium text-danger sm:mr-auto">{message}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="border-danger-border bg-danger-strong text-white hover:bg-danger focus:ring-danger-border dark:bg-danger-strong dark:text-red-950 dark:hover:bg-danger"
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
