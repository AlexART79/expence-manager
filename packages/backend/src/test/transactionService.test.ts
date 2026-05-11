import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { users, categories, transactions } from '../db/schema/index.js';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionNotFoundError,
  CategoryNotOwnedError,
} from '../transactions/transactionService.js';

describe('transactions table', () => {
  it('can insert and retrieve a transaction', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [user] = db
        .insert(users)
        .values({ provider: 'test', providerUserId: 'tx-s1', email: 'a@ex.com', displayName: 'Alice', avatarUrl: null })
        .returning().all();
      const [cat] = db
        .insert(categories)
        .values({ userId: user!.id, name: 'Food' })
        .returning().all();
      const [tx] = db
        .insert(transactions)
        .values({
          userId: user!.id,
          categoryId: cat!.id,
          title: 'Groceries',
          amount: 45.50,
          currency: 'USD',
          transactionDate: '2026-05-01',
          notes: 'weekly shop',
        })
        .returning().all();

      expect(tx).toBeDefined();
      expect(tx!.id).toBeTypeOf('number');
      expect(tx!.title).toBe('Groceries');
      expect(tx!.amount).toBe(45.50);
      expect(tx!.currency).toBe('USD');
      expect(tx!.transactionDate).toBe('2026-05-01');
      expect(tx!.notes).toBe('weekly shop');
      expect(tx!.userId).toBe(user!.id);
      expect(tx!.categoryId).toBe(cat!.id);
      expect(tx!.createdAt).toBeInstanceOf(Date);
    } finally {
      sqlite.close();
    }
  });

  it('stores null notes when omitted', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [user] = db.insert(users).values({ provider: 'test', providerUserId: 'tx-s2', email: 'b@ex.com', displayName: 'Bob', avatarUrl: null }).returning().all();
      const [cat] = db.insert(categories).values({ userId: user!.id, name: 'Food' }).returning().all();
      const [tx] = db.insert(transactions).values({
        userId: user!.id, categoryId: cat!.id, title: 'Coffee',
        amount: 5.00, currency: 'USD', transactionDate: '2026-05-01',
      }).returning().all();
      expect(tx!.notes).toBeNull();
    } finally {
      sqlite.close();
    }
  });
});

describe('transactionService', () => {
  function setup() {
    const { db, sqlite } = createTestDb();
    const [user] = db
      .insert(users)
      .values({ provider: 'test', providerUserId: 'svc-tx1', email: 'svc@tx.com', displayName: 'SvcUser', avatarUrl: null })
      .returning().all();
    const [cat] = db
      .insert(categories)
      .values({ userId: user!.id, name: 'Food' })
      .returning().all();
    return { db, sqlite, user: user!, cat: cat! };
  }

  const baseInput = {
    title: 'Groceries',
    amount: 45.50,
    currency: 'USD',
    transactionDate: '2026-05-01',
    notes: null as string | null,
  };

  it('listTransactions returns empty array for new user', () => {
    const { db, sqlite, user } = setup();
    try {
      expect(listTransactions(db, user.id)).toEqual([]);
    } finally { sqlite.close(); }
  });

  it('createTransaction inserts and returns transaction', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const tx = createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      expect(tx.id).toBeTypeOf('number');
      expect(tx.title).toBe('Groceries');
      expect(tx.amount).toBe(45.50);
      expect(tx.currency).toBe('USD');
      expect(tx.transactionDate).toBe('2026-05-01');
      expect(tx.categoryId).toBe(cat.id);
      expect(tx.userId).toBe(user.id);
      expect(tx.notes).toBeNull();
      expect(tx.createdAt).toBeInstanceOf(Date);
    } finally { sqlite.close(); }
  });

  it('createTransaction throws CategoryNotOwnedError for another user\'s category', () => {
    const { db, sqlite, cat } = setup();
    try {
      expect(() => createTransaction(db, 999, { ...baseInput, categoryId: cat.id }))
        .toThrow(CategoryNotOwnedError);
    } finally { sqlite.close(); }
  });

  it('listTransactions returns only the current user\'s transactions', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const [user2] = db.insert(users).values({ provider: 'test', providerUserId: 'svc-tx2', email: 'svc2@tx.com', displayName: 'User2', avatarUrl: null }).returning().all();
      const [cat2] = db.insert(categories).values({ userId: user2!.id, name: 'Food' }).returning().all();
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      createTransaction(db, user2!.id, { ...baseInput, categoryId: cat2!.id });
      const result = listTransactions(db, user.id);
      expect(result).toHaveLength(1);
      expect(result[0]!.userId).toBe(user.id);
    } finally { sqlite.close(); }
  });

  it('listTransactions filters by search term in title', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, title: 'Grocery Store' });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, title: 'Gas Station' });
      const result = listTransactions(db, user.id, { search: 'Grocery' });
      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe('Grocery Store');
    } finally { sqlite.close(); }
  });

  it('listTransactions filters by search term in notes', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, title: 'Tx1', notes: 'weekend shopping' });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, title: 'Tx2', notes: null });
      const result = listTransactions(db, user.id, { search: 'weekend' });
      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe('Tx1');
    } finally { sqlite.close(); }
  });

  it('listTransactions filters by categoryId', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const [cat2] = db.insert(categories).values({ userId: user.id, name: 'Transport' }).returning().all();
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, title: 'Groceries' });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat2!.id, title: 'Bus pass' });
      const result = listTransactions(db, user.id, { categoryId: cat.id });
      expect(result).toHaveLength(1);
      expect(result[0]!.title).toBe('Groceries');
    } finally { sqlite.close(); }
  });

  it('listTransactions filters by date range', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, transactionDate: '2026-04-15' });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, transactionDate: '2026-05-10' });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, transactionDate: '2026-06-01' });
      const result = listTransactions(db, user.id, { dateFrom: '2026-05-01', dateTo: '2026-05-31' });
      expect(result).toHaveLength(1);
      expect(result[0]!.transactionDate).toBe('2026-05-10');
    } finally { sqlite.close(); }
  });

  it('listTransactions filters by amount range', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, amount: 10 });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, amount: 50 });
      createTransaction(db, user.id, { ...baseInput, categoryId: cat.id, amount: 200 });
      const result = listTransactions(db, user.id, { amountMin: 20, amountMax: 100 });
      expect(result).toHaveLength(1);
      expect(result[0]!.amount).toBe(50);
    } finally { sqlite.close(); }
  });

  it('updateTransaction updates the transaction', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const created = createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      const updated = updateTransaction(db, user.id, created.id, { ...baseInput, categoryId: cat.id, title: 'Updated', amount: 99 });
      expect(updated.title).toBe('Updated');
      expect(updated.amount).toBe(99);
      expect(updated.id).toBe(created.id);
    } finally { sqlite.close(); }
  });

  it('updateTransaction throws TransactionNotFoundError for wrong userId', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const created = createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      expect(() => updateTransaction(db, 999, created.id, { ...baseInput, categoryId: cat.id }))
        .toThrow(TransactionNotFoundError);
    } finally { sqlite.close(); }
  });

  it('updateTransaction throws CategoryNotOwnedError for another user\'s category', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const [user2] = db.insert(users).values({ provider: 'test', providerUserId: 'svc-tx3', email: 'svc3@tx.com', displayName: 'User3', avatarUrl: null }).returning().all();
      const [cat2] = db.insert(categories).values({ userId: user2!.id, name: 'Food' }).returning().all();
      const created = createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      expect(() => updateTransaction(db, user.id, created.id, { ...baseInput, categoryId: cat2!.id }))
        .toThrow(CategoryNotOwnedError);
    } finally { sqlite.close(); }
  });

  it('deleteTransaction removes the transaction', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const created = createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      deleteTransaction(db, user.id, created.id);
      expect(listTransactions(db, user.id)).toHaveLength(0);
    } finally { sqlite.close(); }
  });

  it('deleteTransaction throws TransactionNotFoundError for wrong userId', () => {
    const { db, sqlite, user, cat } = setup();
    try {
      const created = createTransaction(db, user.id, { ...baseInput, categoryId: cat.id });
      expect(() => deleteTransaction(db, 999, created.id)).toThrow(TransactionNotFoundError);
    } finally { sqlite.close(); }
  });
});
