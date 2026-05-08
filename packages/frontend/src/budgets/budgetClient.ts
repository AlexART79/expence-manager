import { z } from "zod";
import { apiClient, type ApiClient } from "../lib/apiClient";

const budgetSchema = z.object({
  id: z.number(),
  month: z.string(),
  amount: z.string(),
  amountCents: z.number(),
  currency: z.literal("USD"),
  createdAt: z.number(),
  updatedAt: z.number()
});

const budgetSummarySchema = z.object({
  month: z.string(),
  budget: budgetSchema.nullable(),
  totalSpent: z.string(),
  totalSpentCents: z.number(),
  remaining: z.string().nullable(),
  remainingCents: z.number().nullable(),
  usagePercentage: z.number().nullable(),
  currency: z.literal("USD")
});

const budgetResponseSchema = z.object({
  budget: budgetSchema.nullable()
});

const budgetSummaryResponseSchema = z.object({
  summary: budgetSummarySchema
});

export type Budget = z.infer<typeof budgetSchema>;
export type BudgetSummary = z.infer<typeof budgetSummarySchema>;

export type BudgetInput = {
  amount: string;
  currency: "USD";
};

export class BudgetClient {
  private readonly api: ApiClient;

  public constructor(api: ApiClient) {
    this.api = api;
  }

  public async getBudget(month: string): Promise<Budget | null> {
    const body = await this.api.get<unknown>(`/api/budgets/${month}`);
    return budgetResponseSchema.parse(body).budget;
  }

  public async setBudget(month: string, input: BudgetInput): Promise<Budget> {
    const body = await this.api.put<unknown>(`/api/budgets/${month}`, input);
    return budgetResponseSchema.extend({ budget: budgetSchema }).parse(body).budget;
  }

  public async getBudgetSummary(month: string): Promise<BudgetSummary> {
    const body = await this.api.get<unknown>(`/api/budgets/${month}/summary`);
    return budgetSummaryResponseSchema.parse(body).summary;
  }
}

export const budgetClient = new BudgetClient(apiClient);
