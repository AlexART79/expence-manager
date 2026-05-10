import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  type Category,
} from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    listCategories()
      .then((data) => { setCats(data); setStatus('idle'); })
      .catch(() => setStatus('error'));
  }, []);

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

  async function handleDelete(id: number) {
    await deleteCategory(id);
    setCats((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleRename(id: number) {
    const updated = await renameCategory(id, renameValue);
    setCats((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setRenamingId(null);
    setRenameValue('');
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-gray-400 dark:text-dark-text-muted">Loading...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-8 text-center text-red-600 dark:text-red-400">
        Failed to load categories. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
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
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add
        </button>
      </form>

      {createError && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{createError}</p>
      )}

      {cats.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-dark-text-secondary">No categories yet.</p>
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
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setRenamingId(null); setRenameValue(''); }}
                    aria-label="Cancel"
                    className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors"
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
                  <button
                    onClick={() => handleDelete(cat.id)}
                    aria-label="Delete"
                    className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
