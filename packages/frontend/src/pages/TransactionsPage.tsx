import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Transaction,
  type TransactionInput,
} from '../lib/transactions.ts';
import { listCategories, type Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';
import TransactionForm from '../components/TransactionForm.tsx';
import ConfirmButton from '../components/ConfirmButton.tsx';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load transactions and categories on mount
  useEffect(() => {
    setStatus('loading');
    Promise.all([
      listTransactions({}),
      listCategories(),
    ])
      .then(([txns, cats]) => {
        setTransactions(txns);
        setCategories(cats);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  function handleCreate() {
    setEditingTransaction(null);
    setFormOpen(true);
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormOpen(true);
  }

  async function handleFormSaved(input: TransactionInput) {
    try {
      let saved: Transaction;

      if (editingTransaction) {
        // Update mode
        saved = await updateTransaction(editingTransaction.id, input);
        setTransactions((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
      } else {
        // Create mode
        saved = await createTransaction(input);
        setTransactions((prev) => [saved, ...prev]);
      }

      setFormOpen(false);
      setEditingTransaction(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to save transaction';
      throw new Error(message);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to delete transaction';
      throw new Error(message);
    }
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
        Failed to load transactions. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text">
          Transactions
        </h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-dark-text-secondary">
          No transactions yet
        </p>
      ) : (
        <div className="bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-dark-border shadow-sm overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">
                  Title
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-dark-text">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {tx.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {tx.currency} {tx.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {category?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text">
                      {tx.transactionDate}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(tx)}
                          aria-label="Edit"
                          className="p-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <ConfirmButton
                          icon={Trash2}
                          iconLabel="Delete"
                          onConfirm={async () => {
                            try {
                              await handleDelete(tx.id);
                            } catch (err) {
                              throw err instanceof Error ? err : new Error('Failed to delete transaction');
                            }
                          }}
                          confirmMessage="Delete this transaction?"
                          isDangerous={true}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-4">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            {editingTransaction ? (
              <TransactionForm
                transaction={editingTransaction}
                categories={categories}
                onSubmit={handleFormSaved}
                onCancel={() => {
                  setFormOpen(false);
                  setEditingTransaction(null);
                }}
              />
            ) : (
              <TransactionForm
                categories={categories}
                onSubmit={handleFormSaved}
                onCancel={() => {
                  setFormOpen(false);
                  setEditingTransaction(null);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
