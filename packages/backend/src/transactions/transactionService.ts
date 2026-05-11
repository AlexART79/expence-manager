import { eq, and, like, gte, lte, or } from 'drizzle-orm';
import { transactions, categories } from '../db/schema/index.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

export interface Transaction {
  id: number;
  userId: number;
  categoryId: number;
  title: string;
  amount: number;
  currency: string;
  transactionDate: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionInput {
  title: string;
  amount: number;
  currency: string;
  transactionDate: string;
  categoryId: number;
  notes?: string | null;
}

export interface TransactionFilters {
  search?: string;
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export class TransactionNotFoundError extends Error {
  constructor() {
    super('Transaction not found');
    this.name = 'TransactionNotFoundError';
  }
}

export class CategoryNotOwnedError extends Error {
  constructor() {
    super('Category not found or does not belong to you');
    this.name = 'CategoryNotOwnedError';
  }
}

function assertCategoryOwned(db: Db, userId: number, categoryId: number): void {
  const cat = db.select().from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .get();
  if (!cat) throw new CategoryNotOwnedError();
}

export function listTransactions(db: Db, userId: number, filters: TransactionFilters = {}): Transaction[] {
  const conditions = [eq(transactions.userId, userId)];

  if (filters.categoryId !== undefined) {
    conditions.push(eq(transactions.categoryId, filters.categoryId));
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    const searchCond = or(like(transactions.title, term), like(transactions.notes, term));
    if (searchCond) conditions.push(searchCond);
  }
  if (filters.dateFrom) {
    conditions.push(gte(transactions.transactionDate, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(transactions.transactionDate, filters.dateTo));
  }
  if (filters.amountMin !== undefined) {
    conditions.push(gte(transactions.amount, filters.amountMin));
  }
  if (filters.amountMax !== undefined) {
    conditions.push(lte(transactions.amount, filters.amountMax));
  }

  return db.select().from(transactions).where(and(...conditions)).all();
}

export function createTransaction(db: Db, userId: number, input: TransactionInput): Transaction {
  assertCategoryOwned(db, userId, input.categoryId);
  const [tx] = db.insert(transactions).values({
    userId,
    categoryId: input.categoryId,
    title: input.title,
    amount: input.amount,
    currency: input.currency,
    transactionDate: input.transactionDate,
    notes: input.notes ?? null,
  }).returning().all();
  if (!tx) throw new Error('Insert returned no row');
  return tx;
}

export function updateTransaction(db: Db, userId: number, id: number, input: TransactionInput): Transaction {
  const existing = db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .get();
  if (!existing) throw new TransactionNotFoundError();

  assertCategoryOwned(db, userId, input.categoryId);

  const [updated] = db.update(transactions)
    .set({
      categoryId: input.categoryId,
      title: input.title,
      amount: input.amount,
      currency: input.currency,
      transactionDate: input.transactionDate,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning().all();
  if (!updated) throw new Error('Update returned no row');
  return updated;
}

export function deleteTransaction(db: Db, userId: number, id: number): void {
  const existing = db.select().from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .get();
  if (!existing) throw new TransactionNotFoundError();
  db.delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .run();
}
