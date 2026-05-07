import { useEffect, useState } from "react";
import { authClient as defaultAuthClient } from "./auth/authClient";
import type { AuthClient, CurrentUser } from "./auth/authClient";

type AppProps = {
  isLoading?: boolean;
  authClient?: AuthClient;
};

export function App({ isLoading = false, authClient = defaultAuthClient }: AppProps) {
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    authClient
      .getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (isCurrent) {
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

  async function handleLogout() {
    await authClient.logout();
    setUser(null);
  }

  return (
    <div
      data-testid="app-root"
      className={`${isDark ? "dark " : ""}min-h-screen bg-surface text-text transition-colors`}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header
          className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
          role="banner"
        >
          <div>
            <p className="text-sm font-medium text-accent-strong">
              {user ? `Signed in with ${user.provider}` : "Authentication"}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-text">Personal Expense Tracker</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {user ? (
              <div className="text-sm text-text-muted">
                <span className="font-medium text-text">{user.displayName}</span>
                {user.email ? <span className="block sm:inline sm:pl-2">{user.email}</span> : null}
              </div>
            ) : null}
            {user ? (
              <button
                type="button"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-slate-600 dark:focus:ring-offset-slate-950"
                onClick={handleLogout}
              >
                Log out
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-slate-600 dark:focus:ring-offset-slate-950"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setIsDark((current) => !current)}
            >
              {isDark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <main className="grid flex-1 content-start gap-6 py-8">
          {isLoading || isBootstrapping ? (
            <section
              className="rounded-lg border border-slate-200 bg-surface-muted p-6 dark:border-slate-700"
              role="status"
              aria-live="polite"
            >
              Loading dashboard
            </section>
          ) : !user ? (
            <section className="rounded-lg border border-slate-200 bg-surface-muted p-6 dark:border-slate-700">
              <h2 className="text-xl font-semibold tracking-normal">Sign in to continue</h2>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                  href={authClient.getProviderLoginUrl("google")}
                >
                  Continue with Google
                </a>
                <a
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-text transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-slate-600 dark:focus:ring-offset-slate-950"
                  href={authClient.getProviderLoginUrl("github")}
                >
                  Continue with GitHub
                </a>
              </div>
            </section>
          ) : (
            <section className="rounded-lg border border-slate-200 bg-surface-muted p-6 dark:border-slate-700">
              <h2 className="text-xl font-semibold tracking-normal">Dashboard foundation</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                Your authenticated workspace is ready for categories, transactions, budgets, and alerts in later stages.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
