import type { BudgetSummary } from "./budgetClient";

export type BudgetFormState = {
  amount: string;
};

export function getCurrentBudgetMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function createBudgetForm(summary: BudgetSummary | null): BudgetFormState {
  return {
    amount: summary?.budget?.amount ?? ""
  };
}

export function validateBudgetForm(form: BudgetFormState) {
  const amount = form.amount.trim();

  if (!amount) {
    return "Budget amount is required";
  }

  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    return "Budget amount must be a valid decimal";
  }

  if (Number(amount) <= 0) {
    return "Budget amount must be greater than 0";
  }

  return null;
}

export function toBudgetInput(form: BudgetFormState) {
  return {
    amount: form.amount.trim(),
    currency: "USD" as const
  };
}
