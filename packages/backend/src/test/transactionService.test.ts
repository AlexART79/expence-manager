import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { users, categories, transactions } from '../db/schema/index.js';

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
