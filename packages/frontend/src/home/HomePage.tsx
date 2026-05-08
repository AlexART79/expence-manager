import type { CurrentUser } from "../auth/authClient";
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
};

export function HomePage({
  user,
  isDark,
  setIsDark,
  onLogout,
  categoryClient,
  transactionClient
}: HomePageProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgb(var(--color-surface)),rgb(var(--color-surface-muted)))]">
      <AppHeader user={user} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout} />

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
