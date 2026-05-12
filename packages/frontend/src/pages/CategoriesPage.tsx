import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  type Category,
} from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';
import ConfirmButton from '../components/ConfirmButton.tsx';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const loadData = useCallback(() => {
    setStatus('loading');
    listCategories()
      .then((data) => { setCats(data); setStatus('idle'); })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      const cat = await createCategory(newName);
      setCats((prev) => [...prev, cat]);
      setNewName('');
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create category');
    }
  }

  async function handleRename(id: number) {
    const updated = await renameCategory(id, renameValue);
    setCats((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setRenamingId(null);
    setRenameValue('');
  }

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto" data-testid="categories-loading-skeleton">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-7 w-32 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
          <div className="h-4 w-24 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
        </div>
        <div className="flex gap-2 mb-4">
          <div className="flex-1 h-10 bg-gray-100 dark:bg-dark-raised rounded-lg animate-pulse" />
          <div className="h-10 w-20 bg-gray-100 dark:bg-dark-raised rounded-lg animate-pulse" />
        </div>
        <ul className="space-y-2">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
            >
              <div className="flex-1 h-4 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto py-16 flex flex-col items-center gap-4 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">Failed to load categories.</p>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Categories</h2>
        <span className="text-sm text-gray-400 dark:text-dark-text-muted">{cats.length} categories</span>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={newName.trim().length === 0}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {createError && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{createError}</p>
      )}

      {cats.length === 0 ? (
        <div
          data-testid="categories-empty-state"
          className="py-16 flex flex-col items-center gap-3 text-center"
        >
          <Tag size={36} className="text-gray-300 dark:text-dark-text-muted" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-dark-text mb-1">No categories yet</p>
            <p className="text-sm text-gray-400 dark:text-dark-text-muted">
              Create a category to organize your transactions.
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {cats.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface"
            >
              {renamingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleRename(cat.id)}
                    disabled={renameValue.trim().length === 0}
                    aria-label="Save"
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setRenamingId(null); setRenameValue(''); }}
                    aria-label="Cancel"
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-900 dark:text-dark-text font-medium">{cat.name}</span>
                  <button
                    onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                    aria-label="Rename"
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <ConfirmButton
                    icon={Trash2}
                    iconLabel="Delete"
                    onConfirm={async () => {
                      try {
                        await deleteCategory(cat.id);
                        setCats((prev) => prev.filter((c) => c.id !== cat.id));
                      } catch (err) {
                        throw err instanceof ApiError ? new Error(err.message) : new Error('Failed to delete category');
                      }
                    }}
                    confirmMessage="Delete this category?"
                    isDangerous={true}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
