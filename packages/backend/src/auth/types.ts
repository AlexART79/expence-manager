export type AuthProvider = "google" | "github";

export type ProviderUser = {
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
};

export type CurrentUser = {
  id: number;
  provider: AuthProvider;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
};
