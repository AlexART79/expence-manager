import { DeleteConfirmationOverlay } from "../components/DeleteConfirmationOverlay";
import type { Category } from "./categoryClient";

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
          Rename category
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            value={editingName}
            maxLength={60}
            onChange={(event) => onEditingNameChange(event.target.value)}
          />
        </label>
      ) : (
        <div className="mode-transition">
          <p className="font-semibold text-text">{category.name}</p>
          <p className="text-xs text-text-muted">Ready for transactions</p>
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

function CategoryRenameActions({
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
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isRenaming}
        onClick={onSave}
      >
        Save category name
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        onClick={onCancel}
      >
        Cancel
      </button>
    </>
  );
}

function CategoryRowActions({
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
        message={`Are you sure you want to delete category ${category.name}?`}
        confirmLabel={`Yes, delete ${category.name}`}
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
        aria-label={`Rename ${category.name}`}
        onClick={onStartRename}
      >
        Rename
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-400/30 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={`Delete ${category.name}`}
        onClick={onAskDelete}
      >
        Delete
      </button>
    </>
  );
}
