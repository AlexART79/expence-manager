import { FIELD_CONTROL_MUTED_CLASS, Field } from "../components/Field";
import type { Category } from "./categoryClient";
import { CATEGORY_COPY, CATEGORY_LIMITS, CATEGORY_MESSAGES } from "./categoryConstants";
import { CategoryRenameActions } from "./CategoryRenameActions";
import { CategoryRowActions } from "./CategoryRowActions";

export function CategoryRow({
  category,
  editingName,
  isEditing,
  isConfirmingDelete,
  isRenaming,
  isDeleting,
  editingError,
  onEditingNameChange,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  category: Category;
  editingName: string;
  isEditing: boolean;
  isConfirmingDelete: boolean;
  isRenaming: boolean;
  isDeleting: boolean;
  editingError?: string | null;
  onEditingNameChange: (name: string) => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <li
      className={`mode-transition relative flex flex-col gap-3 rounded-md border border-line/30 bg-surface-raised px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-none sm:flex-row dark:border-line/10 dark:bg-surface ${
        isEditing ? "sm:items-end" : "sm:items-center"
      } sm:justify-between`}
    >
      {isEditing ? (
        <div className="mode-transition flex-1">
          <Field label={CATEGORY_COPY.renameLabel} error={editingError}>
            <input
              className={FIELD_CONTROL_MUTED_CLASS}
              value={editingName}
              maxLength={CATEGORY_LIMITS.nameMaxLength}
              onChange={(event) => onEditingNameChange(event.target.value)}
            />
          </Field>
        </div>
      ) : (
        <div className="mode-transition">
          <p className="font-semibold text-text">{category.name}</p>
          <p className="text-xs text-text-muted">{CATEGORY_MESSAGES.readyForTransactions}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {isEditing ? (
          <CategoryRenameActions isRenaming={isRenaming} onSave={onSaveRename} onCancel={onCancelRename} />
        ) : (
          <CategoryRowActions
            category={category}
            isConfirmingDelete={isConfirmingDelete}
            isDeleting={isDeleting}
            onStartRename={onStartRename}
            onAskDelete={onAskDelete}
            onCancelDelete={onCancelDelete}
            onConfirmDelete={onConfirmDelete}
          />
        )}
      </div>
    </li>
  );
}
