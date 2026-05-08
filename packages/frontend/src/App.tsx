import { useEffect, useState } from "react";
import { authClient as defaultAuthClient } from "./auth/authClient";
import type { AuthClient, CurrentUser } from "./auth/authClient";
import { AuthErrorScreen } from "./auth/AuthErrorScreen";
import { LoginPage } from "./auth/LoginPage";
import { categoryClient as defaultCategoryClient } from "./categories/categoryClient";
import type { CategoryClient } from "./categories/categoryClient";
import { LoadingScreen } from "./components/LoadingScreen";
import { HomePage } from "./home/HomePage";
import { transactionClient as defaultTransactionClient } from "./transactions/transactionClient";
import type { TransactionClient } from "./transactions/transactionClient";

type AppProps = {
  isLoading?: boolean;
  authClient?: AuthClient;
  categoryClient?: CategoryClient;
  transactionClient?: TransactionClient;
};

type AppRoute = "/" | "/login";

export function App({
  isLoading = false,
  authClient = defaultAuthClient,
  categoryClient = defaultCategoryClient,
  transactionClient = defaultTransactionClient
}: AppProps) {
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromLocation());

  useEffect(() => {
    const handlePopState = () => setRoute(getRouteFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    authClient
      .getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) {
          setAuthError(null);
          setUser(currentUser);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setAuthError(error instanceof Error ? error.message : "Session check failed");
          setUser(null);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsBootstrapping(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [authClient]);

  useEffect(() => {
    if (isBootstrapping || authError) {
      return;
    }

    if (!user && route !== "/login") {
      navigateTo("/login", setRoute, true);
      return;
    }

    if (user && route === "/login") {
      navigateTo("/", setRoute, true);
    }
  }, [authError, isBootstrapping, route, user]);

  async function handleLogout() {
    await authClient.logout();
    setUser(null);
    navigateTo("/login", setRoute, true);
  }

  const isBusy = isLoading || isBootstrapping;

  return (
    <div
      data-testid="app-root"
      className={`${isDark ? "dark " : ""}min-h-screen bg-surface text-text transition-colors`}
    >
      {isBusy ? (
        <LoadingScreen />
      ) : authError ? (
        <AuthErrorScreen message={authError} />
      ) : route === "/login" || !user ? (
        <LoginPage authClient={authClient} isDark={isDark} setIsDark={setIsDark} />
      ) : (
        <HomePage
          user={user}
          isDark={isDark}
          setIsDark={setIsDark}
          onLogout={handleLogout}
          categoryClient={categoryClient}
          transactionClient={transactionClient}
        />
      )}
    </div>
  );
}

function getRouteFromLocation(): AppRoute {
  return window.location.pathname === "/login" ? "/login" : "/";
}

function navigateTo(route: AppRoute, setRoute: (route: AppRoute) => void, replace = false) {
  if (window.location.pathname !== route) {
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", route);
  }
  setRoute(route);
}
