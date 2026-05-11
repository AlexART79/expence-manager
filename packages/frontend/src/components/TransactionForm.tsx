import { useState, useEffect } from 'react';
import type { Transaction, TransactionInput } from '../lib/transactions.ts';
import type { Category } from '../lib/categories.ts';

interface TransactionFormProps {
  transaction?: Transaction;
  categories: Category[];
  onSubmit: (data: TransactionInput) => Promise<void>;
  onCancel: () => void;
}

export default function TransactionForm({
  transaction,
  categories,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction) {
      setTitle(transaction.title);
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId.toString());
      setTransactionDate(transaction.transactionDate);
      setCurrency(transaction.currency);
      setNotes(transaction.notes || '');
    } else {
      setTitle('');
      setAmount('');
      const firstCategory = categories.at(0);
      const initialCategoryId: string = firstCategory
        ? firstCategory.id.toString()
        : '';
      setCategoryId(initialCategoryId);
      const dateString: string = new Date().toISOString().split('T')[0] ?? '';
      setTransactionDate(dateString);
      setCurrency('USD');
      setNotes('');
    }
  }, [transaction, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (!categoryId) {
      setError('Category is required');
      return;
    }

    if (!transactionDate) {
      setError('Date is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData: TransactionInput = {
        title: title.trim(),
        amount: parseFloat(amount),
        categoryId: parseInt(categoryId),
        transactionDate,
        currency,
        notes: notes.trim() || null,
      };

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm border border-red-300 dark:border-red-800/50">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Transaction title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="amount" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Amount
        </label>
        <input
          id="amount"
          type="number"
          placeholder="Amount"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Category
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="date" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="currency" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Currency
        </label>
        <input
          id="currency"
          type="text"
          placeholder="Currency code"
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toUpperCase())}
          maxLength={3}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className="font-semibold text-gray-700 dark:text-dark-text text-sm">
          Notes
        </label>
        <textarea
          id="notes"
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-gray-200 dark:border-dark-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-700 dark:text-dark-text-secondary font-medium hover:bg-gray-50 dark:hover:bg-dark-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {transaction ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
