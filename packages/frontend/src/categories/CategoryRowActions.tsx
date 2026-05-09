import { Button } from "../components/Button";
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
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label={CATEGORY_COPY.renameAriaLabel(category.name)}
        onClick={onStartRename}
      >
        {CATEGORY_COPY.rename}
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        aria-label={CATEGORY_COPY.deleteAriaLabel(category.name)}
        onClick={onAskDelete}
      >
        {CATEGORY_COPY.delete}
      </Button>
    </>
  );
}
