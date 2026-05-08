import type { AuthClient, AuthProvider } from "./authClient";
import { ThemeButton } from "../components/ThemeButton";

type LoginPageProps = {
  authClient: AuthClient;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
};

export function LoginPage({ authClient, isDark, setIsDark }: LoginPageProps) {
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
