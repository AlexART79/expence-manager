import { useState } from "react";
import { ExpandableSection } from "../components/ExpandableSection";
import { InlineAlert } from "../components/InlineAlert";
import { SectionState } from "../components/SectionState";
import { CategoryCreateForm } from "./CategoryCreateForm";
import { CategoryRow } from "./CategoryRow";
import type { CategoryClient } from "./categoryClient";
import { CATEGORY_COPY, CATEGORY_MESSAGES, CATEGORY_PENDING_ACTIONS } from "./categoryConstants";
import { useCategoryManager } from "./useCategoryManager";

const CATEGORY_PANEL_CONTENT_ID = "category-panel-content";

export function CategoryManager({
  categoryClient,
  onCategoriesChanged
}: {
  categoryClient: CategoryClient;
  onCategoriesChanged?: () => void;
}) {
  const manager = useCategoryManager(categoryClient, onCategoriesChanged);
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
        <p className="rounded-full border border-line/35 bg-surface-raised px-3 py-1 text-sm text-text-muted dark:border-line/10 dark:bg-surface">
          {manager.categories.length} {CATEGORY_COPY.activeSuffix}
        </p>
      }
    >
      <CategoryCreateForm
        newName={manager.newName}
        isCreating={manager.pendingAction === CATEGORY_PENDING_ACTIONS.create}
        error={manager.createNameError}
        onNameChange={manager.setNewName}
        onCreate={manager.createCategory}
      />

      {manager.error ? (
        <InlineAlert className="mt-4">{manager.error}</InlineAlert>
      ) : null}

      <div className="mt-5">
        {manager.isLoadingCategories ? (
          <SectionState state="loading" title={CATEGORY_MESSAGES.loading} />
        ) : manager.categories.length === 0 ? (
          <SectionState
            state="empty"
            title={CATEGORY_MESSAGES.emptyTitle}
            description={CATEGORY_MESSAGES.emptyDescription}
          />
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
                editingError={manager.editingId === category.id ? manager.renameNameError : null}
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
