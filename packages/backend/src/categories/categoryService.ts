import { eq, and } from 'drizzle-orm';
import { categories, transactions } from '../db/schema/index.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

export interface Category {
  id: number;
  userId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class DuplicateCategoryNameError extends Error {
  constructor() {
    super('A category with this name already exists');
    this.name = 'DuplicateCategoryNameError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super('Category not found');
    this.name = 'CategoryNotFoundError';
  }
}

export class CategoryHasTransactionsError extends Error {
  constructor() {
    super('Cannot delete category: it has associated transactions');
    this.name = 'CategoryHasTransactionsError';
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return err instanceof Error && (err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export function listCategories(db: Db, userId: number): Category[] {
  return db.select().from(categories).where(eq(categories.userId, userId)).all();
}

export function createCategory(db: Db, userId: number, name: string): Category {
  try {
    const [cat] = db.insert(categories).values({ userId, name }).returning().all();
    if (!cat) throw new Error('Insert returned no row');
    return cat;
  } catch (err) {
    if (isUniqueConstraintError(err)) throw new DuplicateCategoryNameError();
    throw err;
  }
}

export function renameCategory(db: Db, userId: number, categoryId: number, name: string): Category {
  const existing = db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .get();
  if (!existing) throw new CategoryNotFoundError();

  try {
    const [updated] = db
      .update(categories)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
      .returning()
      .all();
    if (!updated) throw new Error('Update returned no row');
    return updated;
  } catch (err) {
    if (isUniqueConstraintError(err)) throw new DuplicateCategoryNameError();
    throw err;
  }
}

export function deleteCategory(db: Db, userId: number, categoryId: number): void {
  const existing = db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .get();
  if (!existing) throw new CategoryNotFoundError();

  const txns = db.select().from(transactions)
    .where(eq(transactions.categoryId, categoryId))
    .all();
  if (txns.length > 0) throw new CategoryHasTransactionsError();

  db.delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .run();
}
