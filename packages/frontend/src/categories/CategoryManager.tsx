import { useState } from "react";
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
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">{CATEGORY_COPY.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">{CATEGORY_COPY.title}</h2>
        </div>
        <div className="flex items-center gap-3 sm:self-end">
          <p className="rounded-full border border-white/10 bg-surface px-3 py-1 text-sm text-text-muted">
            {manager.categories.length} {CATEGORY_COPY.activeSuffix}
          </p>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-surface text-text transition hover:border-accent/60 hover:text-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            aria-label={isExpanded ? CATEGORY_COPY.collapse : CATEGORY_COPY.expand}
            aria-expanded={isExpanded}
            aria-controls={CATEGORY_PANEL_CONTENT_ID}
            onClick={() => setIsExpanded((current) => !current)}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <div id={CATEGORY_PANEL_CONTENT_ID} className="mode-transition">
          <CategoryCreateForm
            newName={manager.newName}
            isCreating={manager.pendingAction === CATEGORY_PENDING_ACTIONS.create}
            onNameChange={manager.setNewName}
            onCreate={manager.createCategory}
          />

          {manager.error ? (
            <p
              className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              role="alert"
            >
              {manager.error}
            </p>
          ) : null}

          <div className="mt-5">
            {manager.isLoadingCategories ? (
              <div
                className="rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted"
                role="status"
              >
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
        </div>
      ) : null}
    </section>
  );
}
