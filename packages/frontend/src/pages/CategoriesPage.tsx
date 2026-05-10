import { useState, useEffect } from 'react';
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
        <span className="text-gray-400 dark:text-gray-600">Loading...</span>
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
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold mb-6">Categories</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={newName.trim().length === 0}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </form>

      {createError && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{createError}</p>
      )}

      {cats.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-gray-400">No categories yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {cats.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              {renamingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleRename(cat.id)}
                    disabled={renameValue.trim().length === 0}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setRenamingId(null); setRenameValue(''); }}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-900 dark:text-gray-100">{cat.name}</span>
                  <button
                    onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                  >
                    Delete
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
