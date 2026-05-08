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
      className={`mode-transition relative flex flex-col gap-3 rounded-md border border-white/10 bg-surface px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-none sm:flex-row ${
        isEditing ? "sm:items-end" : "sm:items-center"
      } sm:justify-between`}
    >
      {isEditing ? (
        <label className="mode-transition grid flex-1 gap-2 text-sm font-medium text-text">
          {CATEGORY_COPY.renameLabel}
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            value={editingName}
            maxLength={CATEGORY_LIMITS.nameMaxLength}
            onChange={(event) => onEditingNameChange(event.target.value)}
          />
        </label>
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
