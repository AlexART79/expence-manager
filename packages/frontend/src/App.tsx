import { useEffect, useState } from "react";
import { authClient as defaultAuthClient } from "./auth/authClient";
import type { AuthClient, AuthProvider, CurrentUser } from "./auth/authClient";
import { CategoryManager } from "./categories/CategoryManager";
import { categoryClient as defaultCategoryClient } from "./categories/categoryClient";
import type { CategoryClient } from "./categories/categoryClient";
import { ThemeButton } from "./components/ThemeButton";
import { TransactionManager } from "./transactions/TransactionManager";
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

function HomePage({
  user,
  isDark,
  setIsDark,
  onLogout,
  categoryClient,
  transactionClient
}: {
  user: CurrentUser | null;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  onLogout: () => void;
  categoryClient: CategoryClient;
  transactionClient: TransactionClient;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgb(var(--color-surface)),rgb(var(--color-surface-muted)))]">
      <header className="border-b border-white/10 bg-surface/90 backdrop-blur" role="banner">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-strong">Expense Tracker</p>
            <h1 className="text-xl font-semibold tracking-normal text-text">Home</h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeButton isDark={isDark} setIsDark={setIsDark} />
            {user ? <UserMenu user={user} onLogout={onLogout} /> : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <CategoryManager categoryClient={categoryClient} />
        <TransactionManager categoryClient={categoryClient} transactionClient={transactionClient} />

        <section className="grid gap-4 md:grid-cols-3">
          {["Monthly flow", "Budget guardrails", "Upcoming alerts"].map((label) => (
            <div key={label} className="rounded-lg border border-white/10 bg-surface-muted p-5">
              <p className="text-sm font-semibold text-text">{label}</p>
              <div className="mt-5 h-2 rounded-full bg-surface">
                <div className="h-2 w-2/3 rounded-full bg-accent" />
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function LoginPage({
  authClient,
  isDark,
  setIsDark
}: {
  authClient: AuthClient;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.18),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(251,191,36,0.12),transparent_28%),linear-gradient(135deg,rgb(var(--color-surface)),rgb(2,6,23))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <section className="relative w-full max-w-md rounded-lg border border-white/10 bg-surface-muted/95 p-7 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong">Secure workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-text">Sign in to Expense Tracker</h1>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              Use your existing account to open your personal finance dashboard.
            </p>
          </div>
          <ThemeButton isDark={isDark} setIsDark={setIsDark} />
        </div>

        <div className="grid gap-3">
          <ProviderButton provider="google" href={authClient.getProviderLoginUrl("google")} />
          <ProviderButton provider="github" href={authClient.getProviderLoginUrl("github")} />
        </div>
      </section>
    </main>
  );
}

function AuthErrorScreen({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="w-full max-w-md rounded-lg border border-red-400/30 bg-surface-muted p-6 shadow-xl shadow-black/15">
        <p className="text-sm font-semibold text-red-300" role="alert">
          Could not verify your session
        </p>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          The backend did not complete the session check. Restart the frontend dev server, then refresh this page.
        </p>
        <p className="mt-4 rounded-md bg-surface px-3 py-2 text-xs text-text-muted">{message}</p>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section
        className="w-full max-w-sm rounded-lg border border-white/10 bg-surface-muted p-6 text-center shadow-xl shadow-black/15"
        role="status"
        aria-live="polite"
      >
        Loading dashboard
      </section>
    </main>
  );
}

function UserMenu({ user, onLogout }: { user: CurrentUser; onLogout: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-surface-muted px-3 py-2">
      {user.avatarUrl ? (
        <img
          className="h-9 w-9 rounded-full object-cover"
          src={user.avatarUrl}
          alt={`${user.displayName} avatar`}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-slate-950">
          {getInitials(user.displayName)}
        </div>
      )}
      <div className="hidden min-w-0 sm:block">
        <p className="truncate text-sm font-semibold text-text">{user.displayName}</p>
        <p className="text-xs capitalize text-text-muted">{user.provider}</p>
      </div>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        onClick={onLogout}
      >
        Log out
      </button>
    </div>
  );
}

function ProviderButton({ provider, href }: { provider: AuthProvider; href: string }) {
  const isGoogle = provider === "google";
  const label = isGoogle ? "Continue with Google" : "Continue with GitHub";

  return (
    <a
      className={`inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-md px-4 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950 ${
        isGoogle
          ? "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          : "border border-slate-950 bg-slate-950 text-white hover:bg-black"
      }`}
      href={href}
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold">
        {isGoogle ? (
          <span aria-hidden="true" className="font-bold text-[#4285f4]">
            G
          </span>
        ) : (
          <span aria-hidden="true" className="text-[10px] font-bold text-slate-950">
            GH
          </span>
        )}
      </span>
      <span className="sr-only">{isGoogle ? "Google" : "GitHub"}</span>
      {label}
    </a>
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
