import { useEffect, useState, useCallback } from 'react';
import { listCategories, type Category } from '../lib/categories.ts';
import { listTransactions, type Transaction } from '../lib/transactions.ts';
import {
  getBudgetSummary,
  getBudget,
  setBudget,
  type BudgetSummary,
  type MonthlyBudget,
} from '../lib/budgets.ts';

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthDateRange(month: string): { dateFrom: string; dateTo: string } {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  const lastDay = new Date(year, monthNum, 0).getDate();
  return {
    dateFrom: `${month}-01`,
    dateTo: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

function formatMonth(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  return new Date(Number(yearStr), Number(monthStr) - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#06b6d4', '#8b5cf6', '#ec4899',
  '#10b981', '#f59e0b', '#3b82f6', '#14b8a6', '#a855f7',
];

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [budget, setBudgetState] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetError, setBudgetError] = useState('');

  const month = getCurrentMonth();
  const { dateFrom, dateTo } = getMonthDateRange(month);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, txns, sum, bgt] = await Promise.all([
        listCategories(),
        listTransactions({ dateFrom, dateTo }),
        getBudgetSummary(month),
        getBudget(month),
      ]);
      setCategories(cats);
      setTransactions(txns);
      setSummary(sum);
      setBudgetState(bgt);
    } catch {
      // UI handles missing data via null/empty states
    } finally {
      setLoading(false);
    }
  }, [month, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSetBudget(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      setBudgetError('Enter a positive amount');
      return;
    }
    setBudgetSaving(true);
    setBudgetError('');
    try {
      await setBudget(month, { amount, currency: 'USD' });
      setBudgetFormOpen(false);
      setBudgetInput('');
      await loadData();
    } catch {
      setBudgetError('Failed to save budget. Try again.');
    } finally {
      setBudgetSaving(false);
    }
  }

  function openBudgetForm() {
    setBudgetInput(budget ? String(budget.amount) : '');
    setBudgetError('');
    setBudgetFormOpen(true);
  }

  function closeBudgetForm() {
    setBudgetFormOpen(false);
    setBudgetInput('');
    setBudgetError('');
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const spendingByCategory = categories
    .map((cat, idx) => {
      const total = transactions
        .filter((tx) => tx.categoryId === cat.id)
        .reduce((sum, tx) => sum + tx.amount, 0);
      return {
        id: cat.id,
        name: cat.name,
        amount: total,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]!,
      };
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const recentTransactions = [...transactions]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, 5);

  const maxAmount = spendingByCategory.length > 0
    ? Math.max(...spendingByCategory.map((c) => c.amount))
    : 1;

  const totalSpent = summary?.totalSpent ?? 0;
  const budgetAmount = summary?.budgetAmount ?? null;
  const usagePercent = summary?.usagePercent ?? null;

  const usageColor =
    budgetAmount === null
      ? 'text-gray-400 dark:text-dark-text-muted'
      : (usagePercent ?? 0) >= 100
      ? 'text-red-600 dark:text-red-400'
      : (usagePercent ?? 0) >= 80
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400';

  const progressBarColor =
    (usagePercent ?? 0) >= 100
      ? 'bg-red-500'
      : (usagePercent ?? 0) >= 80
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  function StatCard({
    label,
    value,
    subtext,
    color,
  }: {
    label: string;
    value: React.ReactNode;
    subtext: React.ReactNode;
    color?: string;
  }) {
    return (
      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-muted mb-2">
          {label}
        </p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 dark:bg-dark-raised rounded animate-pulse mb-1" />
        ) : (
          <p className={`text-2xl font-bold tracking-tight ${color ?? 'text-gray-900 dark:text-dark-text'}`}>
            {value}
          </p>
        )}
        <div className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">{subtext}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text">
          Dashboard
        </h2>
        <span className="text-sm text-gray-400 dark:text-dark-text-muted">
          {formatMonth(month)}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          subtext="This month"
          color="text-red-600 dark:text-red-400"
        />
        <StatCard
          label="Budget Used"
          value={budgetAmount !== null ? `${(usagePercent ?? 0).toFixed(1)}%` : '—'}
          subtext={
            budgetAmount !== null ? (
              `$${budgetAmount.toFixed(2)} budget`
            ) : (
              <button
                onClick={openBudgetForm}
                className="text-emerald-600 dark:text-emerald-400 underline"
              >
                Set budget
              </button>
            )
          }
          color={usageColor}
        />
        <StatCard
          label="Categories"
          value={categories.length}
          subtext={`${categories.length} active`}
        />
        <StatCard
          label="Transactions"
          value={transactions.length}
          subtext="This month"
        />
      </div>

      {/* Budget set/edit inline form */}
      {budgetFormOpen && (
        <div className="mb-6 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-3">
            {budget ? 'Update Monthly Budget' : 'Set Monthly Budget'}
          </h3>
          <form onSubmit={handleSetBudget} className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 dark:text-dark-text-muted">USD $</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder={budget ? String(budget.amount) : '1000'}
                className="w-40 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={budgetSaving}
                autoFocus
              />
            </div>
            {budgetError && (
              <span className="text-xs text-red-500">{budgetError}</span>
            )}
            <button
              type="submit"
              disabled={budgetSaving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {budgetSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeBudgetForm}
              className="px-4 py-2 text-gray-500 dark:text-dark-text-secondary rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-dark-raised"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Mid row: Spending by Category + Monthly Budget panel */}
      <div className="grid grid-cols-[1fr_360px] gap-3 mb-6">
        {/* Spending by Category */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-4">
            Spending by Category
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
              ))}
            </div>
          ) : spendingByCategory.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-dark-text-muted py-4">
              No spending this month yet.
            </p>
          ) : (
            <div className="space-y-4">
              {spendingByCategory.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary w-24 truncate">
                    {cat.name}
                  </span>
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-dark-raised rounded-full overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${(cat.amount / maxAmount) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-dark-text w-20 text-right">
                    ${cat.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Budget panel */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text">
              Monthly Budget
            </h3>
            {!loading && (
              <button
                onClick={openBudgetForm}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {budget ? 'Edit' : 'Set budget'}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="h-8 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
              <div className="h-3 bg-gray-100 dark:bg-dark-raised rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-100 dark:bg-dark-raised rounded animate-pulse w-2/3" />
            </div>
          ) : budgetAmount === null ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 dark:text-dark-text-muted mb-3">
                No budget set for this month.
              </p>
              <button
                onClick={openBudgetForm}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Set Budget
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-end justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-dark-text">
                  ${totalSpent.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 dark:text-dark-text-muted">
                  of ${budgetAmount.toFixed(2)}
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-dark-raised rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full ${progressBarColor}`}
                  style={{ width: `${Math.min((totalSpent / budgetAmount) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                ${(summary?.remaining ?? 0).toFixed(2)} remaining &middot;{' '}
                {(usagePercent ?? 0).toFixed(1)}% used
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-4">
          Recent Transactions
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-dark-raised rounded animate-pulse" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-dark-text-muted py-4">
            No transactions this month yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-raised last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                      {tx.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                      {cat?.name ?? 'Unknown'} &bull; {tx.transactionDate}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    ${tx.amount.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
