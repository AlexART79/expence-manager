import { useEffect, useState } from 'react';
import { listCategories } from '../lib/categories.ts';

type Category = { id: string; name: string; color: string };

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await listCategories();
        setCategories(cats);
      } catch {
        // API error handled silently, mock data will show
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Mock data — TODO: replace with real API calls when transactions/budgets endpoints are available
  const totalSpent = 2480;
  const totalSpentDelta = -12;
  const budgetUsed = 62;
  const transactionCount = 24;

  const categorySpending = [
    { id: '1', name: 'Food', amount: 850, budget: 1000, color: '#ef4444' },
    { id: '2', name: 'Transport', amount: 420, budget: 500, color: '#f97316' },
    { id: '3', name: 'Entertainment', amount: 280, budget: 400, color: '#06b6d4' },
    { id: '4', name: 'Utilities', amount: 650, budget: 700, color: '#8b5cf6' },
    { id: '5', name: 'Shopping', amount: 280, budget: 300, color: '#ec4899' },
  ];

  const recentTransactions = [
    { id: '1', name: 'Grocery Store', category: 'Food', date: 'Today', amount: -45.50, emoji: '🛒' },
    { id: '2', name: 'Gas Station', category: 'Transport', date: 'Yesterday', amount: -52.00, emoji: '⛽' },
    { id: '3', name: 'Movie Tickets', category: 'Entertainment', date: '2 days ago', amount: -28.00, emoji: '🎬' },
    { id: '4', name: 'Electric Bill', category: 'Utilities', date: '3 days ago', amount: -125.00, emoji: '⚡' },
    { id: '5', name: 'Coffee', category: 'Food', date: '4 days ago', amount: -5.50, emoji: '☕' },
  ];

  const statCard = (label: string, value: string | number, subtext: string, color?: string) => (
    <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-dark-text-muted mb-2">
        {label}
      </p>
      <p className={`text-2xl font-bold tracking-tight ${color || 'text-gray-900 dark:text-dark-text'}`}>
        {value}
      </p>
      <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">{subtext}</p>
    </div>
  );

  const maxAmount = Math.max(...categorySpending.map((c) => c.amount));

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Dashboard</h2>
        <span className="text-sm text-gray-400 dark:text-dark-text-muted">May 2026</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {statCard('Total Spent', `$${totalSpent}`, `${totalSpentDelta > 0 ? '+' : ''}${totalSpentDelta}% vs last month`, 'text-red-600 dark:text-red-400')}
        {statCard('Budget Used', `${budgetUsed}%`, 'Within budget', 'text-emerald-600 dark:text-emerald-400')}
        {statCard('Categories', loading ? '...' : categories.length, `${categories.length} active`)}
        {statCard('Transactions', transactionCount, 'This month')}
      </div>

      {/* Mid Row: Spending + Budget Progress */}
      <div className="grid grid-cols-[1fr_360px] gap-3 mb-6">
        {/* Spending by Category */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-4">Spending by Category</h3>
          <div className="space-y-4">
            {categorySpending.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary w-20">{cat.name}</span>
                <div className="flex-1 h-3 bg-gray-100 dark:bg-dark-raised rounded-full overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${(cat.amount / maxAmount) * 100}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text w-16 text-right">
                  ${cat.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Budget Progress */}
        <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-4">Budget Progress</h3>
          <div className="space-y-4">
            {categorySpending.map((cat) => {
              const percent = (cat.amount / cat.budget) * 100;
              const status =
                percent < 80 ? 'emerald' : percent < 100 ? 'amber' : 'red';
              const statusColors = {
                emerald: 'bg-emerald-500 dark:bg-emerald-500',
                amber: 'bg-amber-500 dark:bg-amber-500',
                red: 'bg-red-500 dark:bg-red-500',
              };

              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-dark-text-secondary">
                      {cat.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-dark-text-muted">
                      {Math.round(percent)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-dark-raised rounded-full overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status]}`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-dark-text mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-raised last:border-0">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">{tx.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-dark-text">{tx.name}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                    {tx.category} • {tx.date}
                  </p>
                </div>
              </div>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">${Math.abs(tx.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
