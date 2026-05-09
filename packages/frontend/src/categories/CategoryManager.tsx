import { useState } from "react";
import { ExpandableSection } from "../components/ExpandableSection";
import { CategoryCreateForm } from "./CategoryCreateForm";
import { CategoryRow } from "./CategoryRow";
import type { CategoryClient } from "./categoryClient";
import { CATEGORY_COPY, CATEGORY_MESSAGES, CATEGORY_PENDING_ACTIONS } from "./categoryConstants";
import { useCategoryManager } from "./useCategoryManager";

const CATEGORY_PANEL_CONTENT_ID = "category-panel-content";

export function CategoryManager({ categoryClient }: { categoryClient: CategoryClient }) {
  const manager = useCategoryManager(categoryClient);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ExpandableSection
      eyebrow={CATEGORY_COPY.eyebrow}
      title={CATEGORY_COPY.title}
      panelId={CATEGORY_PANEL_CONTENT_ID}
      isExpanded={isExpanded}
      expandLabel={CATEGORY_COPY.expand}
      collapseLabel={CATEGORY_COPY.collapse}
      onToggle={() => setIsExpanded((current) => !current)}
      actions={
        <p className="rounded-full border border-white/10 bg-surface px-3 py-1 text-sm text-text-muted">
          {manager.categories.length} {CATEGORY_COPY.activeSuffix}
        </p>
      }
    >
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
    </ExpandableSection>
  );
}
