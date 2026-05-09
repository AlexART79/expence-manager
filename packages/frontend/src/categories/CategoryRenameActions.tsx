import { Button } from "../components/Button";
import { CATEGORY_COPY } from "./categoryConstants";

export function CategoryRenameActions({
  isRenaming,
  onSave,
  onCancel
}: {
  isRenaming: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        isLoading={isRenaming}
        onClick={onSave}
      >
        {CATEGORY_COPY.saveName}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onCancel}
      >
        {CATEGORY_COPY.cancel}
      </Button>
    </>
  );
}
