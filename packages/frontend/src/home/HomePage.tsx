import { useState } from "react";
import type { CurrentUser } from "../auth/authClient";
import { BudgetDashboard } from "../budgets/BudgetDashboard";
import type { BudgetClient } from "../budgets/budgetClient";
import { CategoryManager } from "../categories/CategoryManager";
import type { CategoryClient } from "../categories/categoryClient";
import { AppHeader } from "../components/AppHeader";
import { TransactionManager } from "../transactions/TransactionManager";
import type { TransactionClient } from "../transactions/transactionClient";

type HomePageProps = {
  user: CurrentUser | null;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  onLogout: () => void;
  categoryClient: CategoryClient;
  transactionClient: TransactionClient;
  budgetClient: BudgetClient;
};

export function HomePage({
  user,
  isDark,
  setIsDark,
  onLogout,
  categoryClient,
  transactionClient,
  budgetClient
}: HomePageProps) {
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgb(var(--color-surface)),rgb(var(--color-surface-muted)))]">
      <AppHeader user={user} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout} />

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <BudgetDashboard budgetClient={budgetClient} refreshKey={budgetRefreshKey} />
        <CategoryManager categoryClient={categoryClient} />
        <TransactionManager
          categoryClient={categoryClient}
          transactionClient={transactionClient}
          onTransactionsChanged={() => setBudgetRefreshKey((current) => current + 1)}
        />
      </main>
    </div>
  );
}
