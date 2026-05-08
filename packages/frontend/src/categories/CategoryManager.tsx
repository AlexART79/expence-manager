import { useEffect, useState } from "react";
import { CategoryCreateForm } from "./CategoryCreateForm";
import { CategoryRow } from "./CategoryRow";
import type { Category, CategoryClient } from "./categoryClient";

export function CategoryManager({ categoryClient }: { categoryClient: CategoryClient }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingCategories(true);
    categoryClient
      .listCategories()
      .then((loadedCategories) => {
        if (isCurrent) {
          setCategories(loadedCategories);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load categories");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [categoryClient]);

  async function handleCreate() {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setPendingAction("create");
    try {
      const category = await categoryClient.createCategory(trimmedName);
      setCategories((current) => [...current, category].sort(sortCategories));
      setNewName("");
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create category");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRename(categoryId: number) {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setPendingAction(`rename-${categoryId}`);
    try {
      const renamed = await categoryClient.renameCategory(categoryId, trimmedName);
      setCategories((current) =>
        current.map((category) => (category.id === renamed.id ? renamed : category)).sort(sortCategories)
      );
      setEditingId(null);
      setEditingName("");
      setError(null);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Could not rename category");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(category: Category) {
    setPendingAction(`delete-${category.id}`);
    try {
      await categoryClient.deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setDeleteConfirmationId(null);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete category");
    } finally {
      setPendingAction(null);
    }
  }

  function startRename(category: Category) {
    setDeleteConfirmationId(null);
    setEditingId(category.id);
    setEditingName(category.name);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
  }

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">Spending structure</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">Categories</h2>
        </div>
        <p className="text-sm text-text-muted">{categories.length} active</p>
      </div>

      <CategoryCreateForm
        newName={newName}
        isCreating={pendingAction === "create"}
        onNameChange={setNewName}
        onCreate={handleCreate}
      />

      {error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        {isLoadingCategories ? (
          <div className="rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted" role="status">
            Loading categories
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 bg-surface px-4 py-6">
            <p className="text-sm font-semibold text-text">No categories yet</p>
            <p className="mt-1 text-sm text-text-muted">Add the first one to organize future transactions.</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                editingName={editingName}
                isEditing={editingId === category.id}
                isConfirmingDelete={deleteConfirmationId === category.id}
                isRenaming={pendingAction === `rename-${category.id}`}
                isDeleting={pendingAction === `delete-${category.id}`}
                onEditingNameChange={setEditingName}
                onStartRename={() => startRename(category)}
                onSaveRename={() => handleRename(category.id)}
                onCancelRename={cancelRename}
                onAskDelete={() => setDeleteConfirmationId(category.id)}
                onCancelDelete={() => setDeleteConfirmationId(null)}
                onConfirmDelete={() => handleDelete(category)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function sortCategories(left: Category, right: Category) {
  return left.name.localeCompare(right.name);
}
