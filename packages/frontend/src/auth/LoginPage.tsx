import { ThemeButton } from "../components/ThemeButton";
import type { AuthClient } from "./authClient";
import { AUTH_PROVIDERS, LOGIN_COPY } from "./authUiConstants";
import { ProviderButton } from "./ProviderButton";

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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-strong">{LOGIN_COPY.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-text">{LOGIN_COPY.title}</h1>
            <p className="mt-3 text-sm leading-6 text-text-muted">
              {LOGIN_COPY.description}
            </p>
          </div>
          <ThemeButton isDark={isDark} setIsDark={setIsDark} />
        </div>

        <div className="grid gap-3">
          <ProviderButton provider={AUTH_PROVIDERS.google} href={authClient.getProviderLoginUrl(AUTH_PROVIDERS.google)} />
          <ProviderButton provider={AUTH_PROVIDERS.github} href={authClient.getProviderLoginUrl(AUTH_PROVIDERS.github)} />
        </div>
      </section>
    </main>
  );
}
