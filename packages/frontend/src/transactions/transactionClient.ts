import { z } from "zod";
import { apiClient, type ApiClient } from "../lib/apiClient";

const transactionSchema = z.object({
  id: z.number(),
  categoryId: z.number(),
  title: z.string(),
  amount: z.string(),
  amountCents: z.number(),
  transactionDate: z.string(),
  notes: z.string().nullable(),
  currency: z.literal("USD"),
  createdAt: z.number(),
  updatedAt: z.number()
});

const transactionResponseSchema = z.object({
  transaction: transactionSchema
});

const transactionsResponseSchema = z.object({
  transactions: z.array(transactionSchema)
});

export type Transaction = z.infer<typeof transactionSchema>;

export type TransactionInput = {
  title: string;
  amount: string;
  transactionDate: string;
  categoryId: number;
  notes: string | null;
  currency: "USD";
};

export type TransactionFilters = {
  search?: string;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: string;
  amountMax?: string;
};

export class TransactionClient {
  private readonly api: ApiClient;

  public constructor(api: ApiClient) {
    this.api = api;
  }

  public async listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
    const body = await this.api.get<unknown>(`/api/transactions${buildQuery(filters)}`);
    return transactionsResponseSchema.parse(body).transactions;
  }

  public async createTransaction(input: TransactionInput): Promise<Transaction> {
    const body = await this.api.post<unknown>("/api/transactions", input);
    return transactionResponseSchema.parse(body).transaction;
  }

  public async updateTransaction(transactionId: number, input: TransactionInput): Promise<Transaction> {
    const body = await this.api.patch<unknown>(`/api/transactions/${transactionId}`, input);
    return transactionResponseSchema.parse(body).transaction;
  }

  public async deleteTransaction(transactionId: number): Promise<void> {
    await this.api.delete<void>(`/api/transactions/${transactionId}`);
  }
}

function buildQuery(filters: TransactionFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export const transactionClient = new TransactionClient(apiClient);
