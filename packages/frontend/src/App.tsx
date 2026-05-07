import { useState } from "react";

type AppProps = {
  isLoading?: boolean;
};

export function App({ isLoading = false }: AppProps) {
  const [isDark, setIsDark] = useState(false);

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
            <p className="text-sm font-medium text-accent-strong">Project foundation</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-text">Personal Expense Tracker</h1>
          </div>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-slate-600 dark:focus:ring-offset-slate-950"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setIsDark((current) => !current)}
          >
            {isDark ? "Light" : "Dark"}
          </button>
        </header>

        <main className="grid flex-1 content-start gap-6 py-8">
          {isLoading ? (
            <section
              className="rounded-lg border border-slate-200 bg-surface-muted p-6 dark:border-slate-700"
              role="status"
              aria-live="polite"
            >
              Loading dashboard
            </section>
          ) : (
            <section className="rounded-lg border border-slate-200 bg-surface-muted p-6 dark:border-slate-700">
              <h2 className="text-xl font-semibold tracking-normal">Dashboard foundation</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
                The Phase 0 shell is ready for authentication, categories, transactions, budgets, and alerts in later
                stages.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
