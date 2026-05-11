import { api, ApiError } from './apiClient.ts';

export interface MonthlyBudget {
  id: number;
  userId: number;
  month: string;
  amount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  month: string;
  budgetAmount: number | null;
  currency: string;
  totalSpent: number;
  remaining: number | null;
  usagePercent: number | null;
}

export interface BudgetInput {
  amount: number;
  currency: string;
}

export async function getBudget(month: string): Promise<MonthlyBudget | null> {
  try {
    return await api.get<MonthlyBudget>(`/api/budgets/${month}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function setBudget(month: string, input: BudgetInput): Promise<MonthlyBudget> {
  return api.put<MonthlyBudget>(`/api/budgets/${month}`, input);
}

export async function getBudgetSummary(month: string): Promise<BudgetSummary> {
  return api.get<BudgetSummary>(`/api/budgets/${month}/summary`);
}
