import { DeleteConfirmationOverlay } from "../components/DeleteConfirmationOverlay";
import type { Category } from "./categoryClient";
import { CATEGORY_COPY } from "./categoryConstants";

export function CategoryRowActions({
  category,
  isConfirmingDelete,
  isDeleting,
  onStartRename,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  category: Category;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onStartRename: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  if (isConfirmingDelete) {
    return (
      <DeleteConfirmationOverlay
        message={CATEGORY_COPY.deleteMessage(category.name)}
        confirmLabel={CATEGORY_COPY.deleteConfirmLabel(category.name)}
        isDeleting={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={CATEGORY_COPY.renameAriaLabel(category.name)}
        onClick={onStartRename}
      >
        {CATEGORY_COPY.rename}
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-400/30 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={CATEGORY_COPY.deleteAriaLabel(category.name)}
        onClick={onAskDelete}
      >
        {CATEGORY_COPY.delete}
      </button>
    </>
  );
}
