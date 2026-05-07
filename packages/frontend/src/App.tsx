import { useEffect, useState } from "react";
import { authClient as defaultAuthClient } from "./auth/authClient";
import type { AuthClient, AuthProvider, CurrentUser } from "./auth/authClient";
import { categoryClient as defaultCategoryClient } from "./categories/categoryClient";
import type { Category, CategoryClient } from "./categories/categoryClient";

type AppProps = {
  isLoading?: boolean;
  authClient?: AuthClient;
  categoryClient?: CategoryClient;
};

type AppRoute = "/" | "/login";

export function App({ isLoading = false, authClient = defaultAuthClient, categoryClient = defaultCategoryClient }: AppProps) {
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
  categoryClient
}: {
  user: CurrentUser | null;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  onLogout: () => void;
  categoryClient: CategoryClient;
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
                className={`flex flex-col gap-3 rounded-md border border-white/10 bg-surface px-4 py-3 sm:flex-row ${
                  editingId === category.id ? "sm:items-end" : "sm:items-center"
                } sm:justify-between`}
              >
                {editingId === category.id ? (
                  <label className="grid flex-1 gap-2 text-sm font-medium text-text">
                    Rename category
                    <input
                      className="min-h-10 rounded-md border border-white/10 bg-surface-muted px-3 text-sm text-text outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
                      value={editingName}
                      maxLength={60}
                      onChange={(event) => setEditingName(event.target.value)}
                    />
                  </label>
                ) : (
                  <div>
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
      <div className="flex flex-col gap-2 rounded-md border border-red-400/30 bg-red-500/10 p-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium text-red-100">Are you sure you want to delete category {category.name}?</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-md bg-red-300 px-3 text-sm font-semibold text-red-950 transition hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 disabled:opacity-60 dark:focus:ring-offset-slate-950"
            disabled={isDeleting}
            onClick={onConfirmDelete}
          >
            {isDeleting ? "Deleting" : `Yes, delete ${category.name}`}
          </button>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-medium text-text transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-slate-950"
            onClick={onCancelDelete}
          >
            Cancel
          </button>
        </div>
      </div>
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

function sortCategories(left: Category, right: Category) {
  return left.name.localeCompare(right.name);
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
