import type { AuthProvider } from "./authClient";

export const AUTH_PROVIDERS = {
  google: "google",
  github: "github"
} as const satisfies Record<string, AuthProvider>;

export const LOGIN_COPY = {
  eyebrow: "Secure workspace",
  title: "Sign in to Expense Tracker",
  description: "Use your existing account to open your personal finance dashboard."
} as const;

export const PROVIDER_BUTTONS: Record<
  AuthProvider,
  {
    label: string;
    screenReaderLabel: string;
    badge: string;
  }
> = {
  google: {
    label: "Continue with Google",
    screenReaderLabel: "Google",
    badge: "G"
  },
  github: {
    label: "Continue with GitHub",
    screenReaderLabel: "GitHub",
    badge: "GH"
  }
};
