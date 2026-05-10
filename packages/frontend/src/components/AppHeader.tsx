import type { CurrentUser } from "../auth/authClient";
import { ThemeButton } from "./ThemeButton";
import { UserMenu } from "./UserMenu";

type AppHeaderProps = {
  user: CurrentUser | null;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
  onLogout: () => void;
};

export function AppHeader({ user, isDark, setIsDark, onLogout }: AppHeaderProps) {
  return (
    <header className="border-b border-line/25 bg-surface/90 backdrop-blur dark:border-line/10" role="banner">
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
  );
}
