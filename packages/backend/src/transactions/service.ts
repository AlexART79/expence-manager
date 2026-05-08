import { and, desc, eq, gte, like, lte, or, type SQL } from "drizzle-orm";
import type { DatabaseHandle } from "../db/connection.js";
import { categories, transactions } from "../db/schema/index.js";
import { ApiError } from "../errors.js";

type Db = DatabaseHandle["db"];

export type TransactionInput = {
  title: string;
  amount: string;
  transactionDate: string;
  categoryId: number;
  notes?: string | null;
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

export type Transaction = {
  id: number;
  categoryId: number;
  title: string;
  amount: string;
  amountCents: number;
  transactionDate: string;
  notes: string | null;
  currency: "USD";
  createdAt: number;
  updatedAt: number;
};

export function listTransactions(db: Db, userId: number, filters: TransactionFilters): Transaction[] {
  const where = buildTransactionFilters(userId, filters);

  return db
    .select()
    .from(transactions)
    .where(and(...where))
    .orderBy(desc(transactions.transactionDate), desc(transactions.id))
    .all()
    .map(toTransaction);
}

export function createTransaction(db: Db, userId: number, input: TransactionInput): Transaction {
  ensureOwnedCategory(db, userId, input.categoryId);

  const now = Date.now();
  const created = db
    .insert(transactions)
    .values({
      userId,
      categoryId: input.categoryId,
      title: normalizeTitle(input.title),
      amountCents: amountToCents(input.amount),
      transactionDate: input.transactionDate,
      notes: normalizeNotes(input.notes),
      currency: input.currency,
      createdAt: now,
      updatedAt: now
    })
    .returning()
    .get();

  return toTransaction(created);
}

export function updateTransaction(db: Db, userId: number, transactionId: number, input: TransactionInput): Transaction {
  findOwnedTransaction(db, userId, transactionId);
  ensureOwnedCategory(db, userId, input.categoryId);

  const updated = db
    .update(transactions)
    .set({
      categoryId: input.categoryId,
      title: normalizeTitle(input.title),
      amountCents: amountToCents(input.amount),
      transactionDate: input.transactionDate,
      notes: normalizeNotes(input.notes),
      currency: input.currency,
      updatedAt: Date.now()
    })
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .returning()
    .get();

  return toTransaction(updated);
}

export function deleteTransaction(db: Db, userId: number, transactionId: number) {
  findOwnedTransaction(db, userId, transactionId);
  db.delete(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId))).run();
}

function buildTransactionFilters(userId: number, filters: TransactionFilters): SQL[] {
  const where: SQL[] = [eq(transactions.userId, userId)];

  if (filters.search) {
    const search = `%${filters.search}%`;
    where.push(or(like(transactions.title, search), like(transactions.notes, search))!);
  }

  if (filters.categoryId) {
    where.push(eq(transactions.categoryId, filters.categoryId));
  }

  if (filters.dateFrom) {
    where.push(gte(transactions.transactionDate, filters.dateFrom));
  }

  if (filters.dateTo) {
    where.push(lte(transactions.transactionDate, filters.dateTo));
  }

  if (filters.amountMin) {
    where.push(gte(transactions.amountCents, amountToCents(filters.amountMin)));
  }

  if (filters.amountMax) {
    where.push(lte(transactions.amountCents, amountToCents(filters.amountMax)));
  }

  return where;
}

function ensureOwnedCategory(db: Db, userId: number, categoryId: number) {
  const category = db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .get();

  if (!category) {
    throw new ApiError(404, "NOT_FOUND", "Category not found");
  }
}

function findOwnedTransaction(db: Db, userId: number, transactionId: number) {
  const transaction = db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
    .get();

  if (!transaction) {
    throw new ApiError(404, "NOT_FOUND", "Transaction not found");
  }

  return transaction;
}

function normalizeTitle(title: string) {
  return title.trim();
}

function normalizeNotes(notes: string | null | undefined) {
  const trimmed = notes?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function amountToCents(amount: string) {
  const [whole, decimal = ""] = amount.split(".");
  const cents = `${decimal}00`.slice(0, 2);
  return Number(whole) * 100 + Number(cents);
}

function centsToAmount(amountCents: number) {
  return (amountCents / 100).toFixed(2);
}

function toTransaction(transaction: typeof transactions.$inferSelect): Transaction {
  return {
    id: transaction.id,
    categoryId: transaction.categoryId,
    title: transaction.title,
    amount: centsToAmount(transaction.amountCents),
    amountCents: transaction.amountCents,
    transactionDate: transaction.transactionDate,
    notes: transaction.notes,
    currency: transaction.currency,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt
  };
}
