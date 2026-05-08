import { CategoryCreateForm } from "./CategoryCreateForm";
import { CategoryRow } from "./CategoryRow";
import type { CategoryClient } from "./categoryClient";
import { CATEGORY_COPY, CATEGORY_MESSAGES, CATEGORY_PENDING_ACTIONS } from "./categoryConstants";
import { useCategoryManager } from "./useCategoryManager";

export function CategoryManager({ categoryClient }: { categoryClient: CategoryClient }) {
  const manager = useCategoryManager(categoryClient);

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">{CATEGORY_COPY.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">{CATEGORY_COPY.title}</h2>
        </div>
        <p className="text-sm text-text-muted">
          {manager.categories.length} {CATEGORY_COPY.activeSuffix}
        </p>
      </div>

      <CategoryCreateForm
        newName={manager.newName}
        isCreating={manager.pendingAction === CATEGORY_PENDING_ACTIONS.create}
        onNameChange={manager.setNewName}
        onCreate={manager.createCategory}
      />

      {manager.error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {manager.error}
        </p>
      ) : null}

      <div className="mt-5">
        {manager.isLoadingCategories ? (
          <div className="rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted" role="status">
            {CATEGORY_MESSAGES.loading}
          </div>
        ) : manager.categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 bg-surface px-4 py-6">
            <p className="text-sm font-semibold text-text">{CATEGORY_MESSAGES.emptyTitle}</p>
            <p className="mt-1 text-sm text-text-muted">{CATEGORY_MESSAGES.emptyDescription}</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {manager.categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                editingName={manager.editingName}
                isEditing={manager.editingId === category.id}
                isConfirmingDelete={manager.deleteConfirmationId === category.id}
                isRenaming={manager.pendingAction === CATEGORY_PENDING_ACTIONS.rename(category.id)}
                isDeleting={manager.pendingAction === CATEGORY_PENDING_ACTIONS.delete(category.id)}
                onEditingNameChange={manager.setEditingName}
                onStartRename={() => manager.startRename(category)}
                onSaveRename={() => manager.renameCategory(category.id)}
                onCancelRename={manager.cancelRename}
                onAskDelete={() => manager.setDeleteConfirmationId(category.id)}
                onCancelDelete={() => manager.setDeleteConfirmationId(null)}
                onConfirmDelete={() => manager.deleteCategory(category)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
