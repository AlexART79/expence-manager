export function formatBudgetCurrency(amount: string | null) {
  return amount === null ? "--" : `$${amount}`;
}

export function formatBudgetMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);

  if (!year || !monthIndex) {
    return month;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(year, monthIndex - 1, 1)));
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
