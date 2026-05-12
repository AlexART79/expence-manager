import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { users, categories, transactions } from '../db/schema/index.js';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  DuplicateCategoryNameError,
  CategoryNotFoundError,
  CategoryHasTransactionsError,
} from '../categories/categoryService.js';

describe('categories table', () => {
  it('can insert and retrieve a category', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [user] = db
        .insert(users)
        .values({
          provider: 'test',
          providerUserId: 'u1',
          email: 'a@example.com',
          displayName: 'Alice',
          avatarUrl: null,
        })
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
        .values({
          provider: 'test',
          providerUserId: 'u2',
          email: 'b@example.com',
          displayName: 'Bob',
          avatarUrl: null,
        })
        .returning()
        .all();

      db.insert(categories).values({ userId: user!.id, name: 'Food' }).run();
      expect(() =>
        db.insert(categories).values({ userId: user!.id, name: 'Food' }).run(),
      ).toThrow();
    } finally {
      sqlite.close();
    }
  });

  it('allows the same name for different users', () => {
    const { db, sqlite } = createTestDb();
    try {
      const [u1] = db
        .insert(users)
        .values({
          provider: 'test',
          providerUserId: 'u3',
          email: 'c@example.com',
          displayName: 'Carol',
          avatarUrl: null,
        })
        .returning()
        .all();
      const [u2] = db
        .insert(users)
        .values({
          provider: 'test',
          providerUserId: 'u4',
          email: 'd@example.com',
          displayName: 'Dave',
          avatarUrl: null,
        })
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

describe('categoryService', () => {
  function setup() {
    const { db, sqlite } = createTestDb();
    const [user] = db
      .insert(users)
      .values({
        provider: 'test',
        providerUserId: 'svc-u1',
        email: 'svc@test.com',
        displayName: 'SvcUser',
        avatarUrl: null,
      })
      .returning()
      .all();
    return { db, sqlite, user: user! };
  }

  it('listCategories returns empty array for new user', () => {
    const { db, sqlite, user } = setup();
    try {
      expect(listCategories(db, user.id)).toEqual([]);
    } finally {
      sqlite.close();
    }
  });

  it('createCategory inserts and returns category', () => {
    const { db, sqlite, user } = setup();
    try {
      const cat = createCategory(db, user.id, 'Groceries');
      expect(cat.id).toBeTypeOf('number');
      expect(cat.name).toBe('Groceries');
      expect(cat.userId).toBe(user.id);
      expect(cat.createdAt).toBeInstanceOf(Date);
    } finally {
      sqlite.close();
    }
  });

  it('createCategory throws DuplicateCategoryNameError on duplicate', () => {
    const { db, sqlite, user } = setup();
    try {
      createCategory(db, user.id, 'Food');
      expect(() => createCategory(db, user.id, 'Food')).toThrow(DuplicateCategoryNameError);
    } finally {
      sqlite.close();
    }
  });

  it('renameCategory updates the name', () => {
    const { db, sqlite, user } = setup();
    try {
      const cat = createCategory(db, user.id, 'Old');
      const updated = renameCategory(db, user.id, cat.id, 'New');
      expect(updated.name).toBe('New');
      expect(updated.id).toBe(cat.id);
    } finally {
      sqlite.close();
    }
  });

  it('renameCategory throws CategoryNotFoundError for wrong userId', () => {
    const { db, sqlite, user } = setup();
    try {
      const cat = createCategory(db, user.id, 'Mine');
      expect(() => renameCategory(db, 999, cat.id, 'Stolen')).toThrow(CategoryNotFoundError);
    } finally {
      sqlite.close();
    }
  });

  it('renameCategory throws DuplicateCategoryNameError on name conflict', () => {
    const { db, sqlite, user } = setup();
    try {
      createCategory(db, user.id, 'Alpha');
      const beta = createCategory(db, user.id, 'Beta');
      expect(() => renameCategory(db, user.id, beta.id, 'Alpha')).toThrow(
        DuplicateCategoryNameError,
      );
    } finally {
      sqlite.close();
    }
  });

  it('deleteCategory removes the category', () => {
    const { db, sqlite, user } = setup();
    try {
      const cat = createCategory(db, user.id, 'Temp');
      deleteCategory(db, user.id, cat.id);
      expect(listCategories(db, user.id)).toHaveLength(0);
    } finally {
      sqlite.close();
    }
  });

  it('deleteCategory throws CategoryNotFoundError for wrong userId', () => {
    const { db, sqlite, user } = setup();
    try {
      const cat = createCategory(db, user.id, 'Protected');
      expect(() => deleteCategory(db, 999, cat.id)).toThrow(CategoryNotFoundError);
    } finally {
      sqlite.close();
    }
  });

  it('deleteCategory throws CategoryHasTransactionsError when transactions exist', () => {
    const { db, sqlite, user } = setup();
    try {
      const cat = createCategory(db, user.id, 'Food');
      db.insert(transactions)
        .values({
          userId: user.id,
          categoryId: cat.id,
          title: 'Groceries',
          amount: 45.5,
          currency: 'USD',
          transactionDate: '2026-05-01',
          notes: null,
        })
        .run();
      expect(() => deleteCategory(db, user.id, cat.id)).toThrow(CategoryHasTransactionsError);
    } finally {
      sqlite.close();
    }
  });
});
