import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "./apiClient";

describe("ApiClient", () => {
  it("requests JSON from paths relative to the configured API base URL", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    });
    const client = new ApiClient("http://localhost:4000", fetcher);

    const result = await client.get<{ status: string }>("/health");

    expect(fetcher).toHaveBeenCalledWith("http://localhost:4000/health", {
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
    const client = new ApiClient("http://localhost:4000", fetcher);

    await expect(client.get("/health")).rejects.toThrow("Nope");
  });
});
