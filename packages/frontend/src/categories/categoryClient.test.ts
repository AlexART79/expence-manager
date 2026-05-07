import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../lib/apiClient";
import { CategoryClient } from "./categoryClient";

describe("CategoryClient", () => {
  it("lists categories from the API response", async () => {
    const api = new ApiClient(
      "http://localhost:3000",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          categories: [{ id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 }]
        })
      })
    );
    const client = new CategoryClient(api);

    await expect(client.listCategories()).resolves.toEqual([
      { id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 }
    ]);
  });

  it("sends create, rename, and delete requests through the typed API client", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ category: { id: 1, name: "Groceries", createdAt: 123, updatedAt: 123 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ category: { id: 1, name: "Food", createdAt: 123, updatedAt: 456 } })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({})
      });
    const client = new CategoryClient(new ApiClient("http://localhost:3000", fetcher));

    await client.createCategory("Groceries");
    await client.renameCategory(1, "Food");
    await client.deleteCategory(1);

    expect(fetcher).toHaveBeenNthCalledWith(1, "http://localhost:3000/api/categories", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Groceries" })
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, "http://localhost:3000/api/categories/1", {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Food" })
    });
    expect(fetcher).toHaveBeenNthCalledWith(3, "http://localhost:3000/api/categories/1", {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
  });
});
