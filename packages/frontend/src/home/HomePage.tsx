import { useState } from "react";
import type { CurrentUser } from "../auth/authClient";
import { BudgetAlertBanners } from "../budgetAlerts/BudgetAlertBanners";
import type { BudgetAlertClient } from "../budgetAlerts/budgetAlertClient";
import { useBudgetAlerts } from "../budgetAlerts/useBudgetAlerts";
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
  budgetAlertClient: BudgetAlertClient;
};

export function HomePage({
  user,
  isDark,
  setIsDark,
  onLogout,
  categoryClient,
  transactionClient,
  budgetClient,
  budgetAlertClient
}: HomePageProps) {
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const budgetAlerts = useBudgetAlerts(budgetAlertClient, Boolean(user));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgb(var(--color-surface)),rgb(var(--color-surface-muted)))]">
      <AppHeader user={user} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout} />

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <BudgetAlertBanners alerts={budgetAlerts.alerts} onDismiss={budgetAlerts.dismissAlert} />
        <BudgetDashboard budgetClient={budgetClient} refreshKey={budgetRefreshKey} />
        <CategoryManager
          categoryClient={categoryClient}
          onCategoriesChanged={() => setCategoryRefreshKey((current) => current + 1)}
        />
        <TransactionManager
          categoryClient={categoryClient}
          transactionClient={transactionClient}
          categoryRefreshKey={categoryRefreshKey}
          onTransactionsChanged={() => setBudgetRefreshKey((current) => current + 1)}
        />
      </main>
    </div>
  );
}
