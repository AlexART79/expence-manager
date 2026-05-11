import { api } from './apiClient.ts';

export interface Transaction {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  currency: string;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  search?: string;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface TransactionInput {
  title: string;
  amount: number;
  currency: string;
  transactionDate: string;
  categoryId: number;
  notes?: string | null;
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId !== undefined) params.set('categoryId', String(filters.categoryId));
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.amountMin !== undefined) params.set('amountMin', String(filters.amountMin));
  if (filters.amountMax !== undefined) params.set('amountMax', String(filters.amountMax));
  const qs = params.toString();
  return api.get<Transaction[]>(`/api/transactions${qs ? `?${qs}` : ''}`);
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  return api.post<Transaction>('/api/transactions', input);
}

export async function updateTransaction(id: number, input: TransactionInput): Promise<Transaction> {
  return api.put<Transaction>(`/api/transactions/${id}`, input);
}

export async function deleteTransaction(id: number): Promise<void> {
  return api.delete<void>(`/api/transactions/${id}`);
}
