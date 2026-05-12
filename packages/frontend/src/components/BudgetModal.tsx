import { useEffect, useRef, useState } from 'react';
import { setBudget, type MonthlyBudget } from '../lib/budgets.ts';

interface BudgetModalProps {
  isOpen: boolean;
  month: string;
  budget: MonthlyBudget | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function BudgetModal({
  isOpen,
  month,
  budget,
  onClose,
  onSuccess,
}: BudgetModalProps) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const onCloseRef = useRef(onClose);
  const savingRef = useRef(saving);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    savingRef.current = saving;
  });
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    isOpenRef.current = isOpen;
  });

  useEffect(() => {
    if (isOpen) {
      setInput(budget ? String(budget.amount) : '');
      setError('');
    }
  }, [isOpen, budget]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenRef.current && !savingRef.current) onCloseRef.current();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a positive amount');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await setBudget(month, { amount, currency: 'USD' });
      onClose();
      await onSuccess();
    } catch {
      setError('Failed to save budget. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      data-testid="budget-modal-backdrop"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Budget"
        className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-gray-900 dark:text-dark-text mb-4">
          {budget ? 'Update Monthly Budget' : 'Set Monthly Budget'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-400 dark:text-dark-text-muted whitespace-nowrap">
              USD $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={budget ? String(budget.amount) : '1000'}
              className="flex-1 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={saving}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-raised disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
