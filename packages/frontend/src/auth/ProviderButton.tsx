import type { AuthProvider } from "./authClient";
import { AUTH_PROVIDERS, PROVIDER_BUTTONS } from "./authUiConstants";

export function ProviderButton({ provider, href }: { provider: AuthProvider; href: string }) {
  const isGoogle = provider === AUTH_PROVIDERS.google;
  const providerButton = PROVIDER_BUTTONS[provider];

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
            {providerButton.badge}
          </span>
        ) : (
          <span aria-hidden="true" className="text-[10px] font-bold text-slate-950">
            {providerButton.badge}
          </span>
        )}
      </span>
      <span className="sr-only">{providerButton.screenReaderLabel}</span>
      {providerButton.label}
    </a>
  );
}
