import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { authClient as defaultAuthClient } from "./auth/authClient";
import type { AuthClient, AuthProvider, CurrentUser } from "./auth/authClient";
import { categoryClient as defaultCategoryClient } from "./categories/categoryClient";
import type { Category, CategoryClient } from "./categories/categoryClient";
import { transactionClient as defaultTransactionClient } from "./transactions/transactionClient";
import type { Transaction, TransactionClient, TransactionFilters, TransactionInput } from "./transactions/transactionClient";

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
    if (isBootstrapping) {
      return;
    }

    if (authError) {
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

type TransactionFormState = {
  title: string;
  amount: string;
  transactionDate: string;
  categoryId: string;
  notes: string;
  currency: "USD";
};

function TransactionManager({
  categoryClient,
  transactionClient
}: {
  categoryClient: CategoryClient;
  transactionClient: TransactionClient;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: ""
  });
  const [form, setForm] = useState<TransactionFormState>(createEmptyTransactionForm());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingTransactions(true);
    Promise.all([categoryClient.listCategories(), transactionClient.listTransactions()])
      .then(([loadedCategories, loadedTransactions]) => {
        if (isCurrent) {
          setCategories(loadedCategories);
          setTransactions(loadedTransactions);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load transactions");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingTransactions(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [categoryClient, transactionClient]);

  async function applyFilters() {
    setPendingAction("filter");
    try {
      const loadedTransactions = await transactionClient.listTransactions(toTransactionFilters(filters));
      setTransactions(loadedTransactions);
      setError(null);
    } catch (filterError) {
      setError(filterError instanceof Error ? filterError.message : "Could not filter transactions");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveTransaction() {
    const validationError = validateTransactionForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const input = toTransactionInput(form);
    const action = editingTransaction ? `update-${editingTransaction.id}` : "create-transaction";
    setPendingAction(action);
    try {
      const saved = editingTransaction
        ? await transactionClient.updateTransaction(editingTransaction.id, input)
        : await transactionClient.createTransaction(input);

      setTransactions((current) =>
        editingTransaction
          ? current.map((transaction) => (transaction.id === saved.id ? saved : transaction)).sort(sortTransactions)
          : [saved, ...current].sort(sortTransactions)
      );
      setForm(createEmptyTransactionForm());
      setEditingTransaction(null);
      setIsFormOpen(false);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save transaction");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteTransaction(transactionId: number) {
    setPendingAction(`delete-transaction-${transactionId}`);
    try {
      await transactionClient.deleteTransaction(transactionId);
      setTransactions((current) => current.filter((transaction) => transaction.id !== transactionId));
      setDeleteConfirmationId(null);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete transaction");
    } finally {
      setPendingAction(null);
    }
  }

  function startCreate() {
    setEditingTransaction(null);
    setForm(createEmptyTransactionForm());
    setDeleteConfirmationId(null);
    setIsFormOpen(true);
  }

  function startEdit(transaction: Transaction) {
    setEditingTransaction(transaction);
    setForm({
      title: transaction.title,
      amount: transaction.amount,
      transactionDate: transaction.transactionDate,
      categoryId: String(transaction.categoryId),
      notes: transaction.notes ?? "",
      currency: transaction.currency
    });
    setDeleteConfirmationId(null);
    setIsFormOpen(false);
  }

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">Spending ledger</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">Transactions</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          onClick={startCreate}
        >
          Add transaction
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <label className="grid gap-2 text-sm font-medium text-text">
          Search transactions
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Title or notes"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-text">
          Filter by category
          <select
            className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            value={filters.categoryId}
            onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value }))}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-text">
          From date
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-text">
          To date
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-text">
          Minimum amount
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
            inputMode="decimal"
            value={filters.amountMin}
            onChange={(event) => setFilters((current) => ({ ...current, amountMin: event.target.value }))}
            placeholder="0.00"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-text">
          Maximum amount
          <input
            className="min-h-10 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
            inputMode="decimal"
            value={filters.amountMax}
            onChange={(event) => setFilters((current) => ({ ...current, amountMax: event.target.value }))}
            placeholder="999.00"
          />
        </label>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center self-end rounded-md border border-white/10 px-4 text-sm font-semibold text-text transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
          disabled={pendingAction === "filter"}
          onClick={applyFilters}
        >
          Apply filters
        </button>
      </div>

      {isFormOpen && !editingTransaction ? (
        <div className="mode-transition mt-5 rounded-md border border-white/10 bg-surface p-4">
          <TransactionFormFields
            categories={categories}
            form={form}
            setForm={setForm}
            labels={{
              title: "Transaction title",
              amount: "Amount",
              transactionDate: "Transaction date",
              category: "Category",
              notes: "Notes"
            }}
          />
          <TransactionFormActions
            saveLabel="Save transaction"
            isSaving={pendingAction === "create-transaction"}
            onSave={handleSaveTransaction}
            onCancel={() => {
              setIsFormOpen(false);
              setForm(createEmptyTransactionForm());
            }}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        {isLoadingTransactions ? (
          <div className="rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted" role="status">
            Loading transactions
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 bg-surface px-4 py-6">
            <p className="text-sm font-semibold text-text">{hasActiveTransactionFilters(filters) ? "No transactions match" : "No transactions yet"}</p>
            <p className="mt-1 text-sm text-text-muted">
              {hasActiveTransactionFilters(filters)
                ? "Adjust filters to broaden the ledger."
                : "Add the first expense once categories are ready."}
            </p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className={`mode-transition relative grid gap-3 rounded-md border border-white/10 bg-surface px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-none ${
                  editingTransaction?.id === transaction.id
                    ? "md:grid-cols-1 md:items-end"
                    : "md:grid-cols-[1fr_auto] md:items-center"
                }`}
              >
                {editingTransaction?.id === transaction.id ? (
                  <div className="mode-transition">
                    <TransactionFormFields
                      categories={categories}
                      form={form}
                      setForm={setForm}
                      labels={{
                        title: "Edit transaction title",
                        amount: "Edit amount",
                        transactionDate: "Edit transaction date",
                        category: "Edit category",
                        notes: "Edit notes"
                      }}
                    />
                    <TransactionFormActions
                      saveLabel="Save transaction changes"
                      isSaving={pendingAction === `update-${transaction.id}`}
                      onSave={handleSaveTransaction}
                      onCancel={() => {
                        setEditingTransaction(null);
                        setForm(createEmptyTransactionForm());
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div className="mode-transition min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="font-semibold text-text">{transaction.title}</p>
                        <p className="text-sm font-semibold text-accent-strong">{formatCurrency(transaction.amount)}</p>
                        <p className="text-xs text-text-muted">{transaction.transactionDate}</p>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">
                        {categoryNameFor(categories, transaction.categoryId)}
                        {transaction.notes ? ` - ${transaction.notes}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                        aria-label={`Edit ${transaction.title}`}
                        onClick={() => startEdit(transaction)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-400/30 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                        aria-label={`Delete ${transaction.title}`}
                        onClick={() => setDeleteConfirmationId(transaction.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
                {deleteConfirmationId === transaction.id ? (
                  <DeleteConfirmationOverlay
                    message={`Are you sure you want to delete transaction ${transaction.title}?`}
                    confirmLabel={`Yes, delete ${transaction.title}`}
                    isDeleting={pendingAction === `delete-transaction-${transaction.id}`}
                    onConfirm={() => handleDeleteTransaction(transaction.id)}
                    onCancel={() => setDeleteConfirmationId(null)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function TransactionFormFields({
  categories,
  form,
  setForm,
  labels
}: {
  categories: Category[];
  form: TransactionFormState;
  setForm: Dispatch<SetStateAction<TransactionFormState>>;
  labels: {
    title: string;
    amount: string;
    transactionDate: string;
    category: string;
    notes: string;
  };
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.title}
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.title}
          maxLength={120}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Lunch"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.amount}
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          inputMode="decimal"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          placeholder="12.50"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.transactionDate}
        <input
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          type="date"
          value={form.transactionDate}
          onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        {labels.category}
        <select
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.categoryId}
          onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
        >
          <option value="">Choose category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text">
        Currency
        <select
          className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.currency}
          onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value as "USD" }))}
        >
          <option value="USD">USD</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-text md:col-span-2">
        {labels.notes}
        <textarea
          className="min-h-20 rounded-md border border-white/10 bg-surface-muted px-3 py-2 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
          value={form.notes}
          maxLength={500}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Optional"
        />
      </label>
    </div>
  );
}

function TransactionFormActions({
  saveLabel,
  isSaving,
  onSave,
  onCancel
}: {
  saveLabel: string;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
        disabled={isSaving}
        onClick={onSave}
      >
        {saveLabel}
      </button>
      <button
        type="button"
        className="inline-flex min-h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}

function CategoryManager({ categoryClient }: { categoryClient: CategoryClient }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoadingCategories(true);
    categoryClient
      .listCategories()
      .then((loadedCategories) => {
        if (isCurrent) {
          setCategories(loadedCategories);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load categories");
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [categoryClient]);

  async function handleCreate() {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setPendingAction("create");
    try {
      const category = await categoryClient.createCategory(trimmedName);
      setCategories((current) => [...current, category].sort(sortCategories));
      setNewName("");
      setError(null);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create category");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRename(categoryId: number) {
    const trimmedName = editingName.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setPendingAction(`rename-${categoryId}`);
    try {
      const renamed = await categoryClient.renameCategory(categoryId, trimmedName);
      setCategories((current) =>
        current.map((category) => (category.id === renamed.id ? renamed : category)).sort(sortCategories)
      );
      setEditingId(null);
      setEditingName("");
      setError(null);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : "Could not rename category");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(category: Category) {
    setPendingAction(`delete-${category.id}`);
    try {
      await categoryClient.deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      setDeleteConfirmationId(null);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete category");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-surface-muted p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-accent-strong">Spending structure</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal text-text">Categories</h2>
        </div>
        <p className="text-sm text-text-muted">{categories.length} active</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="grid gap-2 text-sm font-medium text-text">
          Category name
          <input
            className="min-h-11 rounded-md border border-white/10 bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/40"
            value={newName}
            maxLength={60}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Groceries"
          />
        </label>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center self-end rounded-md bg-accent px-4 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-950"
          disabled={pendingAction === "create"}
          onClick={handleCreate}
        >
          {pendingAction === "create" ? "Adding" : "Add category"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        {isLoadingCategories ? (
          <div className="rounded-md border border-white/10 bg-surface px-4 py-5 text-sm text-text-muted" role="status">
            Loading categories
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/15 bg-surface px-4 py-6">
            <p className="text-sm font-semibold text-text">No categories yet</p>
            <p className="mt-1 text-sm text-text-muted">Add the first one to organize future transactions.</p>
          </div>
        ) : (
          <ul className="grid gap-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className={`mode-transition relative flex flex-col gap-3 rounded-md border border-white/10 bg-surface px-4 py-3 transition-all duration-200 ease-out motion-reduce:transition-none sm:flex-row ${
                  editingId === category.id ? "sm:items-end" : "sm:items-center"
                } sm:justify-between`}
              >
                {editingId === category.id ? (
                  <label className="mode-transition grid flex-1 gap-2 text-sm font-medium text-text">
                    Rename category
                    <input
                      className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                      value={editingName}
                      maxLength={60}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                  </label>
                ) : (
                  <div className="mode-transition">
                    <p className="font-semibold text-text">{category.name}</p>
                    <p className="text-xs text-text-muted">Ready for transactions</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {editingId === category.id ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center justify-center rounded-md bg-accent px-3 text-sm font-semibold text-slate-950 transition hover:bg-accent-strong focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
                        disabled={pendingAction === `rename-${category.id}`}
                        onClick={() => handleRename(category.id)}
                      >
                        Save category name
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <CategoryRowActions
                      category={category}
                      isConfirmingDelete={deleteConfirmationId === category.id}
                      isDeleting={pendingAction === `delete-${category.id}`}
                      onStartRename={() => {
                        setDeleteConfirmationId(null);
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                      onAskDelete={() => setDeleteConfirmationId(category.id)}
                      onCancelDelete={() => setDeleteConfirmationId(null)}
                      onConfirmDelete={() => handleDelete(category)}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function CategoryRowActions({
  category,
  isConfirmingDelete,
  isDeleting,
  onStartRename,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete
}: {
  category: Category;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  onStartRename: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  if (isConfirmingDelete) {
    return (
      <DeleteConfirmationOverlay
        message={`Are you sure you want to delete category ${category.name}?`}
        confirmLabel={`Yes, delete ${category.name}`}
        isDeleting={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    );
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={`Rename ${category.name}`}
        onClick={onStartRename}
      >
        Rename
      </button>
      <button
        type="button"
        className="inline-flex min-h-9 items-center justify-center rounded-md border border-red-400/30 px-3 text-sm font-medium text-red-200 transition hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        aria-label={`Delete ${category.name}`}
        onClick={onAskDelete}
      >
        Delete
      </button>
    </>
  );
}

function DeleteConfirmationOverlay({
  message,
  confirmLabel,
  isDeleting,
  onConfirm,
  onCancel
}: {
  message: string;
  confirmLabel: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col justify-center gap-2 rounded-md border border-red-400/30 bg-surface/95 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end"
      data-delete-confirmation-overlay
    >
      <p className="min-w-0 text-sm font-medium text-red-100 sm:mr-auto">{message}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center rounded-md bg-red-300 px-3 text-sm font-semibold text-red-950 transition hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Deleting" : confirmLabel}
        </button>
        <button
          type="button"
          className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function sortCategories(left: Category, right: Category) {
  return left.name.localeCompare(right.name);
}

function createEmptyTransactionForm(): TransactionFormState {
  return {
    title: "",
    amount: "",
    transactionDate: "",
    categoryId: "",
    notes: "",
    currency: "USD"
  };
}

function validateTransactionForm(form: TransactionFormState) {
  if (!form.title.trim()) {
    return "Transaction title is required";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(form.amount.trim()) || Number(form.amount) <= 0) {
    return "Amount must be greater than 0";
  }

  if (!form.transactionDate) {
    return "Transaction date is required";
  }

  if (!form.categoryId) {
    return "Category is required";
  }

  if (form.currency !== "USD") {
    return "Currency must be USD";
  }

  if (form.notes.length > 500) {
    return "Notes are too long";
  }

  return null;
}

function toTransactionInput(form: TransactionFormState): TransactionInput {
  const notes = form.notes.trim();
  return {
    title: form.title.trim(),
    amount: form.amount.trim(),
    transactionDate: form.transactionDate,
    categoryId: Number(form.categoryId),
    notes: notes.length > 0 ? notes : null,
    currency: form.currency
  };
}

function toTransactionFilters(filters: {
  search: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}): TransactionFilters {
  return {
    search: filters.search.trim() || undefined,
    categoryId: filters.categoryId ? Number(filters.categoryId) : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    amountMin: filters.amountMin.trim() || undefined,
    amountMax: filters.amountMax.trim() || undefined
  };
}

function hasActiveTransactionFilters(filters: {
  search: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
}) {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

function sortTransactions(left: Transaction, right: Transaction) {
  const dateCompare = right.transactionDate.localeCompare(left.transactionDate);
  return dateCompare === 0 ? right.id - left.id : dateCompare;
}

function categoryNameFor(categories: Category[], categoryId: number) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Uncategorized";
}

function formatCurrency(amount: string) {
  return `$${amount}`;
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

function ThemeButton({ isDark, setIsDark }: { isDark: boolean; setIsDark: (value: boolean) => void }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setIsDark(!isDark)}
    >
      {isDark ? "Light" : "Dark"}
    </button>
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
