import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { users, categories } from '../db/schema/index.js';

describe('categories table', () => {
  it('can insert and retrieve a category', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [user] = db
        .insert(users)
        .values({ provider: 'test', providerUserId: 'u1', email: 'a@example.com', displayName: 'Alice', avatarUrl: null })
        .returning()
        .all();

      const [cat] = db
        .insert(categories)
        .values({ userId: user!.id, name: 'Groceries' })
        .returning()
        .all();

      expect(cat).toBeDefined();
      expect(cat!.id).toBeTypeOf('number');
      expect(cat!.name).toBe('Groceries');
      expect(cat!.userId).toBe(user!.id);
      expect(cat!.createdAt).toBeInstanceOf(Date);
    } finally {
      sqlite.close();
    }
  });

  it('rejects duplicate name for the same user', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [user] = db
        .insert(users)
        .values({ provider: 'test', providerUserId: 'u2', email: 'b@example.com', displayName: 'Bob', avatarUrl: null })
        .returning()
        .all();

      db.insert(categories).values({ userId: user!.id, name: 'Food' }).run();
      expect(() => db.insert(categories).values({ userId: user!.id, name: 'Food' }).run()).toThrow();
    } finally {
      sqlite.close();
    }
  });

  it('allows the same name for different users', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [u1] = db
        .insert(users)
        .values({ provider: 'test', providerUserId: 'u3', email: 'c@example.com', displayName: 'Carol', avatarUrl: null })
        .returning()
        .all();
      const [u2] = db
        .insert(users)
        .values({ provider: 'test', providerUserId: 'u4', email: 'd@example.com', displayName: 'Dave', avatarUrl: null })
        .returning()
        .all();

      expect(() => {
        db.insert(categories).values({ userId: u1!.id, name: 'Travel' }).run();
        db.insert(categories).values({ userId: u2!.id, name: 'Travel' }).run();
      }).not.toThrow();
    } finally {
      sqlite.close();
    }
  });
});
