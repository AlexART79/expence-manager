import { describe, expect, it, vi } from "vitest";
import { ApiClient, ApiError } from "./apiClient";

describe("ApiClient", () => {
  it("requests JSON from paths relative to the configured API base URL", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    });
    const client = new ApiClient("http://localhost:3000", fetcher);

    const result = await client.get<{ status: string }>("/health");

    expect(fetcher).toHaveBeenCalledWith("http://localhost:3000/health", {
      credentials: "include",
      headers: { Accept: "application/json" }
    });
    expect(result).toEqual({ status: "ok" });
  });

  it("throws an error for non-ok API responses", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: "Nope" } })
    });
    const client = new ApiClient("http://localhost:3000", fetcher);

    await expect(client.get("/health")).rejects.toThrow("Nope");
  });

  it("throws a typed API error with status and backend code", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: { code: "DUPLICATE_CATEGORY", message: "Category already exists" } })
    });
    const client = new ApiClient("http://localhost:3000", fetcher);

    await expect(client.post("/api/categories", { name: "Food" })).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      code: "DUPLICATE_CATEGORY",
      message: "Category already exists"
    });
  });

  it("falls back to a stable message when error responses are empty or not JSON", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      }
    });
    const client = new ApiClient("http://localhost:3000", fetcher);

    await expect(client.get("/api/categories")).rejects.toBeInstanceOf(ApiError);
    await expect(client.get("/api/categories")).rejects.toThrow("API request failed with status 502");
  });

  it("posts JSON with credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({})
    });
    const client = new ApiClient("http://localhost:3000", fetcher);

    await client.post("/api/auth/logout");

    expect(fetcher).toHaveBeenCalledWith("http://localhost:3000/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: undefined
    });
  });

  it("puts JSON with credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ saved: true })
    });
    const client = new ApiClient("http://localhost:3000", fetcher);

    await client.put("/api/budgets/2026-05", { amount: "500.00", currency: "USD" });

    expect(fetcher).toHaveBeenCalledWith("http://localhost:3000/api/budgets/2026-05", {
      method: "PUT",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount: "500.00", currency: "USD" })
    });
  });

  it("keeps the native fetch window binding when using the default fetcher", async () => {
    const originalFetch = globalThis.fetch;
    const fetcher = vi.fn(function (this: typeof globalThis) {
      if (this !== globalThis) {
        throw new TypeError("Illegal invocation");
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ status: "ok" })
      } as Response);
    });
    globalThis.fetch = fetcher as typeof fetch;

    try {
      const client = new ApiClient("http://localhost:3000");

      await expect(client.get("/health")).resolves.toEqual({ status: "ok" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
