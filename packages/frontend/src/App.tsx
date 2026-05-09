import { useLayoutEffect } from "react";
import { APP_ROUTES, THEME_CLASSES } from "./app/appConstants";
import { useAppRoute } from "./app/useAppRoute";
import { authClient as defaultAuthClient } from "./auth/authClient";
import type { AuthClient } from "./auth/authClient";
import { AuthErrorScreen } from "./auth/AuthErrorScreen";
import { LoginPage } from "./auth/LoginPage";
import { useAuthSession } from "./auth/useAuthSession";
import { budgetClient as defaultBudgetClient } from "./budgets/budgetClient";
import type { BudgetClient } from "./budgets/budgetClient";
import { categoryClient as defaultCategoryClient } from "./categories/categoryClient";
import type { CategoryClient } from "./categories/categoryClient";
import { LoadingScreen } from "./components/LoadingScreen";
import { useThemePreference } from "./components/useThemePreference";
import { HomePage } from "./home/HomePage";
import { transactionClient as defaultTransactionClient } from "./transactions/transactionClient";
import type { TransactionClient } from "./transactions/transactionClient";

type AppProps = {
  isLoading?: boolean;
  authClient?: AuthClient;
  categoryClient?: CategoryClient;
  transactionClient?: TransactionClient;
  budgetClient?: BudgetClient;
};

export function App({
  isLoading = false,
  authClient = defaultAuthClient,
  categoryClient = defaultCategoryClient,
  transactionClient = defaultTransactionClient,
  budgetClient = defaultBudgetClient
}: AppProps) {
  const { isDark, setIsDark } = useThemePreference();
  const { route, navigateTo } = useAppRoute();
  const { user, authError, isBootstrapping, logout } = useAuthSession(authClient, navigateTo);

  useLayoutEffect(() => {
    if (isBootstrapping || authError) {
      return;
    }

    if (!user && route !== APP_ROUTES.login) {
      navigateTo(APP_ROUTES.login, true);
      return;
    }

    if (user && route === APP_ROUTES.login) {
      navigateTo(APP_ROUTES.home, true);
    }
  }, [authError, isBootstrapping, navigateTo, route, user]);

  const isBusy = isLoading || isBootstrapping;

  return (
    <div
      data-testid="app-root"
      className={`${isDark ? THEME_CLASSES.darkPrefix : ""}min-h-screen bg-surface text-text transition-colors`}
    >
      {isBusy ? (
        <LoadingScreen />
      ) : authError ? (
        <AuthErrorScreen message={authError} />
      ) : route === APP_ROUTES.login || !user ? (
        <LoginPage authClient={authClient} isDark={isDark} setIsDark={setIsDark} />
      ) : (
        <HomePage
          user={user}
          isDark={isDark}
          setIsDark={setIsDark}
          onLogout={logout}
          categoryClient={categoryClient}
          transactionClient={transactionClient}
          budgetClient={budgetClient}
        />
      )}
    </div>
  );
}
