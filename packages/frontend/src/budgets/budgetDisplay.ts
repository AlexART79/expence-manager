export function formatBudgetCurrency(amount: string | null) {
  return amount === null ? "--" : `$${amount}`;
}

export function formatUsagePercentage(value: number | null) {
  return value === null ? "--" : `${value.toFixed(2).replace(/\.00$/, "")}%`;
}

export function getUsageBarWidth(value: number | null) {
  if (value === null) {
    return "0%";
  }

  return `${Math.min(Math.max(value, 0), 100)}%`;
}
