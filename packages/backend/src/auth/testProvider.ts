import type { AuthProvider, ProviderUser } from "./types.js";

export function getTestProviderUser(provider: AuthProvider, code: string): ProviderUser {
  if (!code.startsWith("test-")) {
    throw new Error("Invalid test auth code");
  }

  if (provider === "google") {
    return {
      provider,
      providerUserId: "google-test-user",
      email: "google.user@example.com",
      displayName: "Google Test User",
      avatarUrl: "https://example.com/google.png"
    };
  }

  return {
    provider,
    providerUserId: "github-test-user",
    email: null,
    displayName: "GitHub Test User",
    avatarUrl: "https://example.com/github.png"
  };
}
