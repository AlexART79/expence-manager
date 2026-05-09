import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../lib/apiClient";
import { BudgetClient } from "./budgetClient";

function createApiClient(overrides: Partial<ApiClient>): ApiClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    buildUrl: vi.fn(),
    ...overrides
  } as ApiClient;
}

const budget = {
  id: 1,
  month: "2026-05",
  amount: "500.00",
  amountCents: 50000,
  currency: "USD" as const,
  createdAt: 123,
  updatedAt: 123
};

describe("BudgetClient", () => {
  it("gets a monthly budget", async () => {
    const api = createApiClient({
      get: vi.fn().mockResolvedValue({ budget })
    });
    const client = new BudgetClient(api);

    await expect(client.getBudget("2026-05")).resolves.toEqual(budget);

    expect(api.get).toHaveBeenCalledWith("/api/budgets/2026-05");
  });

  it("sets a monthly budget", async () => {
    const api = createApiClient({
      put: vi.fn().mockResolvedValue({ budget })
    } as Partial<ApiClient>);
    const client = new BudgetClient(api);

    await expect(client.setBudget("2026-05", { amount: "500.00", currency: "USD" })).resolves.toEqual(budget);

    expect(api.put).toHaveBeenCalledWith("/api/budgets/2026-05", { amount: "500.00", currency: "USD" });
  });

  it("gets a selected-month summary with a no-budget state", async () => {
    const summary = {
      month: "2026-05",
      budget: null,
      totalSpent: "12.50",
      totalSpentCents: 1250,
      remaining: null,
      remainingCents: null,
      usagePercentage: null,
      currency: "USD" as const
    };
    const api = createApiClient({
      get: vi.fn().mockResolvedValue({ summary })
    });
    const client = new BudgetClient(api);

    await expect(client.getBudgetSummary("2026-05")).resolves.toEqual(summary);

    expect(api.get).toHaveBeenCalledWith("/api/budgets/2026-05/summary");
  });
});
