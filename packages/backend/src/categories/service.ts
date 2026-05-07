import { and, eq, sql } from "drizzle-orm";
import type { DatabaseHandle } from "../db/connection.js";
import { categories } from "../db/schema/index.js";
import { ApiError } from "../errors.js";

type Db = DatabaseHandle["db"];

export type Category = {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export function listCategories(db: Db, userId: number): Category[] {
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.name)
    .all()
    .map(toCategory);
}

export function createCategory(db: Db, userId: number, nameInput: string): Category {
  const name = normalizeDisplayName(nameInput);
  const normalizedName = normalizeCategoryName(name);
  ensureCategoryNameIsAvailable(db, userId, normalizedName);

  const now = Date.now();
  const created = db
    .insert(categories)
    .values({
      userId,
      name,
      normalizedName,
      createdAt: now,
      updatedAt: now
    })
    .returning()
    .get();

  return toCategory(created);
}

export function renameCategory(db: Db, userId: number, categoryId: number, nameInput: string): Category {
  const existing = findOwnedCategory(db, userId, categoryId);
  const name = normalizeDisplayName(nameInput);
  const normalizedName = normalizeCategoryName(name);
  const duplicate = findCategoryByNormalizedName(db, userId, normalizedName);

  if (duplicate && duplicate.id !== existing.id) {
    throw new ApiError(409, "CONFLICT", "Category name already exists");
  }

  const updated = db
    .update(categories)
    .set({
      name,
      normalizedName,
      updatedAt: Date.now()
    })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning()
    .get();

  return toCategory(updated);
}

export function deleteCategory(db: Db, userId: number, categoryId: number) {
  findOwnedCategory(db, userId, categoryId);

  if (categoryHasTransactions(db, categoryId)) {
    throw new ApiError(409, "CONFLICT", "Category has transactions and cannot be deleted");
  }

  db.delete(categories).where(and(eq(categories.id, categoryId), eq(categories.userId, userId))).run();
}

export function normalizeDisplayName(name: string) {
  return name.trim();
}

function normalizeCategoryName(name: string) {
  return name.toLocaleLowerCase();
}

function ensureCategoryNameIsAvailable(db: Db, userId: number, normalizedName: string) {
  if (findCategoryByNormalizedName(db, userId, normalizedName)) {
    throw new ApiError(409, "CONFLICT", "Category name already exists");
  }
}

function findCategoryByNormalizedName(db: Db, userId: number, normalizedName: string) {
  return db
    .select()
    .from(categories)
    .where(and(eq(categories.userId, userId), eq(categories.normalizedName, normalizedName)))
    .get();
}

function findOwnedCategory(db: Db, userId: number, categoryId: number) {
  const category = db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .get();

  if (!category) {
    throw new ApiError(404, "NOT_FOUND", "Category not found");
  }

  return category;
}

function categoryHasTransactions(db: Db, categoryId: number) {
  const table = db.get<{ table_exists: number }>(sql`
    select 1 as table_exists
    from sqlite_master
    where type = 'table' and name = 'transactions'
    limit 1
  `);

  if (!table) {
    return false;
  }

  const reference = db.get<{ transaction_exists: number }>(sql`
    select 1 as transaction_exists
    from transactions
    where category_id = ${categoryId}
    limit 1
  `);

  return Boolean(reference);
}

function toCategory(category: typeof categories.$inferSelect): Category {
  return {
    id: category.id,
    name: category.name,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
}
