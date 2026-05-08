import { describe, expect, it, vi } from "vitest";
import { ApiClient } from "../lib/apiClient";
import { TransactionClient } from "./transactionClient";

describe("TransactionClient", () => {
  it("lists transactions with filters from the API response", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transactions: [
          {
            id: 1,
            categoryId: 2,
            title: "Groceries",
            amount: "42.35",
            amountCents: 4235,
            transactionDate: "2026-05-08",
            notes: "market",
            currency: "USD",
            createdAt: 123,
            updatedAt: 123
          }
        ]
      })
    });
    const client = new TransactionClient(new ApiClient("http://localhost:3000", fetcher));

    await expect(
      client.listTransactions({
        search: "market",
        categoryId: 2,
        dateFrom: "2026-05-01",
        dateTo: "2026-05-31",
        amountMin: "20",
        amountMax: "50"
      })
    ).resolves.toEqual([
      {
        id: 1,
        categoryId: 2,
        title: "Groceries",
        amount: "42.35",
        amountCents: 4235,
        transactionDate: "2026-05-08",
        notes: "market",
        currency: "USD",
        createdAt: 123,
        updatedAt: 123
      }
    ]);
    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:3000/api/transactions?search=market&categoryId=2&dateFrom=2026-05-01&dateTo=2026-05-31&amountMin=20&amountMax=50",
      {
        credentials: "include",
        headers: { Accept: "application/json" }
      }
    );
  });

  it("sends create, update, and delete requests through the typed API client", async () => {
    const transaction = {
      id: 1,
      categoryId: 2,
      title: "Groceries",
      amount: "42.35",
      amountCents: 4235,
      transactionDate: "2026-05-08",
      notes: null,
      currency: "USD" as const,
      createdAt: 123,
      updatedAt: 123
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ transaction }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ transaction: { ...transaction, title: "Food" } }) })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) });
    const client = new TransactionClient(new ApiClient("http://localhost:3000", fetcher));
    const input = {
      title: "Groceries",
      amount: "42.35",
      transactionDate: "2026-05-08",
      categoryId: 2,
      notes: null,
      currency: "USD" as const
    };

    await client.createTransaction(input);
    await client.updateTransaction(1, { ...input, title: "Food" });
    await client.deleteTransaction(1);

    expect(fetcher).toHaveBeenNthCalledWith(1, "http://localhost:3000/api/transactions", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(input)
    });
    expect(fetcher).toHaveBeenNthCalledWith(2, "http://localhost:3000/api/transactions/1", {
      method: "PATCH",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ...input, title: "Food" })
    });
    expect(fetcher).toHaveBeenNthCalledWith(3, "http://localhost:3000/api/transactions/1", {
      method: "DELETE",
      credentials: "include",
      headers: { Accept: "application/json" }
    });
  });
});
