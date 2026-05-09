import { useEffect, useState } from "react";
import type { Category, CategoryClient } from "./categoryClient";
import { CATEGORY_MESSAGES, CATEGORY_PENDING_ACTIONS } from "./categoryConstants";
import { sortCategories } from "./categorySorting";

export function useCategoryManager(categoryClient: CategoryClient, onCategoriesChanged?: () => void) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createNameError, setCreateNameError] = useState<string | null>(null);
  const [renameNameError, setRenameNameError] = useState<string | null>(null);
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
          setError(loadError instanceof Error ? loadError.message : CATEGORY_MESSAGES.loadFailed);
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

  async function createCategory() {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setCreateNameError(CATEGORY_MESSAGES.nameRequired);
      return;
    }

    setPendingAction(CATEGORY_PENDING_ACTIONS.create);
    try {
      const category = await categoryClient.createCategory(trimmedName);
      setCategories((current) => [...current, category].sort(sortCategories));
      setNewName("");
      setError(null);
      setCreateNameError(null);
      onCategoriesChanged?.();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : CATEGORY_MESSAGES.createFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function renameCategory(categoryId: number) {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setRenameNameError(CATEGORY_MESSAGES.nameRequired);
      return;
    }

    setPendingAction(CATEGORY_PENDING_ACTIONS.rename(categoryId));
    try {
      const renamed = await categoryClient.renameCategory(categoryId, trimmedName);
      setCategories((current) =>
        current.map((category) => (category.id === renamed.id ? renamed : category)).sort(sortCategories)
      );
      setEditingId(null);
      setEditingName("");
      setError(null);
      setRenameNameError(null);
      onCategoriesChanged?.();
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : CATEGORY_MESSAGES.renameFailed);
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteCategory(category: Category) {
    setPendingAction(CATEGORY_PENDING_ACTIONS.delete(category.id));
    try {
      await categoryClient.deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setDeleteConfirmationId(null);
      setError(null);
      onCategoriesChanged?.();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : CATEGORY_MESSAGES.deleteFailed);
    } finally {
      setPendingAction(null);
    }
  }

  function startRename(category: Category) {
    setDeleteConfirmationId(null);
    setEditingId(category.id);
    setEditingName(category.name);
    setRenameNameError(null);
  }

  function cancelRename() {
    setEditingId(null);
    setEditingName("");
    setRenameNameError(null);
  }

  return {
    categories,
    newName,
    editingId,
    editingName,
    deleteConfirmationId,
    error,
    createNameError,
    renameNameError,
    isLoadingCategories,
    pendingAction,
    setEditingName: (name: string) => {
      setEditingName(name);
      setRenameNameError(null);
    },
    setNewName: (name: string) => {
      setNewName(name);
      setCreateNameError(null);
    },
    setDeleteConfirmationId,
    createCategory,
    renameCategory,
    deleteCategory,
    startRename,
    cancelRename
  };
}
