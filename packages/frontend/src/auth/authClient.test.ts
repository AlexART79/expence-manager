import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../lib/apiClient";
import { AuthClient } from "./authClient";

describe("AuthClient", () => {
  it("loads the current user through the API client", async () => {
    const api = new ApiClient("http://localhost:4000", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: {
          id: 1,
          provider: "google",
          email: "google.user@example.com",
          displayName: "Google Test User",
          avatarUrl: null
        }
      })
    }));
    const client = new AuthClient(api);

    await expect(client.getCurrentUser()).resolves.toEqual({
      id: 1,
      provider: "google",
      email: "google.user@example.com",
      displayName: "Google Test User",
      avatarUrl: null
    });
  });

  it("builds provider login URLs", () => {
    const client = new AuthClient(new ApiClient("http://localhost:4000"));

    expect(client.getProviderLoginUrl("github")).toBe("http://localhost:4000/auth/github/start");
  });
});
