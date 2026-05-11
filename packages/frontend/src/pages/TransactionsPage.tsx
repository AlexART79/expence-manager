import { useState, useEffect } from 'react';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Transaction,
  type TransactionInput,
  type TransactionFilters,
} from '../lib/transactions.ts';
import { listCategories, type Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';
import TransactionForm from '../components/TransactionForm.tsx';
import './TransactionsPage.css';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Load transactions and categories on mount and when filters change
  useEffect(() => {
    setStatus('loading');
    Promise.all([
      listTransactions(filters),
      listCategories(),
    ])
      .then(([txns, cats]) => {
        setTransactions(txns);
        setCategories(cats);
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, [filters]);

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
      setDeleteError(null);
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to delete transaction';
      setDeleteError(message);
    }
  }

  function handleFilterChange(key: keyof TransactionFilters, value: string | number | undefined) {
    setFilters((prev) => {
      const updated = { ...prev };
      if (value === undefined || value === '' || value === 0) {
        delete updated[key];
      } else {
        (updated[key] as string | number) = value;
      }
      return updated;
    });
  }

  if (status === 'loading') {
    return (
      <div className="transactions-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="transactions-page">
        <p>Failed to load transactions</p>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          Add Transaction
        </button>
      </div>

      <div className="transactions-content">
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet</p>
        ) : (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const category = categories.find((c) => c.id === tx.categoryId);
                return (
                  <tr key={tx.id}>
                    <td>{tx.title}</td>
                    <td>
                      {tx.currency} {tx.amount.toFixed(2)}
                    </td>
                    <td>{category?.name || 'Unknown'}</td>
                    <td>{tx.transactionDate}</td>
                    <td>
                      <button
                        className="btn btn-small"
                        onClick={() => handleEdit(tx)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => setDeleteConfirmId(tx.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
            <TransactionForm
              transaction={editingTransaction || undefined}
              categories={categories}
              onSubmit={handleFormSaved}
              onCancel={() => {
                setFormOpen(false);
                setEditingTransaction(null);
              }}
            />
          </div>
        </div>
      )}

      {deleteConfirmId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete this transaction?</h2>
            {deleteError && <div className="error-message">{deleteError}</div>}
            <p>This action cannot be undone.</p>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
