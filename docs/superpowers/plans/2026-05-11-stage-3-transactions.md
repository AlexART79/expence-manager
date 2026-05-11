# Stage 3: Transactions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full transaction CRUD with search/filter for authenticated users — backend schema, migration, service, API routes, category-deletion protection, frontend API lib, TransactionsPage component, form modal, filter bar, and routing.

**Architecture:** A `transactions` table is added to the SQLite schema with FK references to `users` and `categories`. A `transactionService.ts` module encapsulates all DB queries and throws typed errors (`TransactionNotFoundError`, `CategoryNotOwnedError`); `categoryService.ts` gains `CategoryHasTransactionsError` to block deletion when a category has transactions. Thin Express routers delegate to services with auth enforcement. The frontend gains a typed `transactions.ts` lib, a `TransactionsPage` component with a filter bar and create/edit modal, and a new nav link.

**Tech Stack:** Express, TypeScript, Drizzle ORM, better-sqlite3, Zod, Vitest (backend); React 18, Vite, TypeScript, Tailwind, React Router v6, Zod (form validation), Vitest + Testing Library (frontend).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/backend/src/db/schema/index.ts` | Modify | Add `transactions` table |
| `packages/backend/src/db/migrations/0002_<slug>.sql` | Generate | SQL migration (via `db:generate`) |
| `packages/backend/src/transactions/transactionService.ts` | Create | All transaction DB + business logic |
| `packages/backend/src/routes/transactions.ts` | Create | Thin Express router |
| `packages/backend/src/app.ts` | Modify | Register transactions router |
| `packages/backend/src/categories/categoryService.ts` | Modify | Add `CategoryHasTransactionsError` guard in `deleteCategory` |
| `packages/backend/src/routes/categories.ts` | Modify | Handle `CategoryHasTransactionsError` → 409 |
| `packages/backend/src/test/transactionService.test.ts` | Create | Schema + service unit tests |
| `packages/backend/src/test/transactions.test.ts` | Create | API integration tests |
| `packages/backend/src/test/categoryService.test.ts` | Modify | Add deletion-with-transactions test |
| `packages/backend/src/test/categories.test.ts` | Modify | Add API 409 test for deleting category with transactions |
| `packages/frontend/src/lib/transactions.ts` | Create | Typed API helper functions |
| `packages/frontend/src/pages/TransactionsPage.tsx` | Create | Transaction management UI (list + form modal + filters) |
| `packages/frontend/src/test/TransactionsPage.test.tsx` | Create | Component tests |
| `packages/frontend/src/App.tsx` | Modify | Add `/transactions` route + nav link |
| `packages/frontend/src/test/App.test.tsx` | Modify | Add transactions routing test |

---

## Task 1: Transaction Schema + Migration + Schema Tests

**Files:**
- Modify: `packages/backend/src/db/schema/index.ts`
- Generate: `packages/backend/src/db/migrations/0002_<slug>.sql`
- Modify: `packages/backend/src/test/transactionService.test.ts` (schema section only)

- [ ] **Step 1.1: Add transactions table to schema**

Replace the full contents of `packages/backend/src/db/schema/index.ts`:

```typescript
import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    provider: text('provider').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    providerIdx: uniqueIndex('users_provider_provider_user_id_idx').on(
      table.provider,
      table.providerUserId,
    ),
  }),
);

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userNameIdx: uniqueIndex('categories_user_id_name_idx').on(table.userId, table.name),
  }),
);

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  transactionDate: text('transaction_date').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

- [ ] **Step 1.2: Write failing schema test**

Create `packages/backend/src/test/transactionService.test.ts` with this content (service tests will be added in Task 2):

```typescript
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
```

- [ ] **Step 1.3: Run test — expect FAIL (schema not migrated yet)**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | head -40
```

Expected: FAIL with "no such table: transactions"

- [ ] **Step 1.4: Generate the migration**

```bash
cd packages/backend && npm run db:generate
```

Expected: A new file `packages/backend/src/db/migrations/0002_<slug>.sql` is created. Inspect it to confirm it contains `CREATE TABLE transactions`.

- [ ] **Step 1.5: Run tests — expect PASS**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | head -60
```

Expected: All tests PASS including the two new schema tests.

- [ ] **Step 1.6: Commit**

```bash
git add packages/backend/src/db/schema/index.ts packages/backend/src/db/migrations/ packages/backend/src/test/transactionService.test.ts
git commit -m "feat: add transactions table schema and migration"
```

---

## Task 2: Transaction Service + Unit Tests

**Files:**
- Modify: `packages/backend/src/test/transactionService.test.ts` (add service tests)
- Create: `packages/backend/src/transactions/transactionService.ts`

- [ ] **Step 2.1: Add service unit tests to the existing test file**

Append a new `describe('transactionService', ...)` block to `packages/backend/src/test/transactionService.test.ts`. Add these imports at the top of the file:

```typescript
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionNotFoundError,
  CategoryNotOwnedError,
} from '../transactions/transactionService.js';
```

Then append this describe block after the existing `describe('transactions table', ...)` block:

```typescript
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
```

- [ ] **Step 2.2: Run tests — expect FAIL**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | head -40
```

Expected: FAIL with "Cannot find module '../transactions/transactionService.js'"

- [ ] **Step 2.3: Create the transaction service**

Create `packages/backend/src/transactions/transactionService.ts`:

```typescript
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
```

- [ ] **Step 2.4: Run tests — expect PASS**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | head -80
```

Expected: All tests PASS.

- [ ] **Step 2.5: Commit**

```bash
git add packages/backend/src/transactions/transactionService.ts packages/backend/src/test/transactionService.test.ts
git commit -m "feat: add transaction service with CRUD and filter operations"
```

---

## Task 3: Category Deletion Protection

**Files:**
- Modify: `packages/backend/src/categories/categoryService.ts`
- Modify: `packages/backend/src/routes/categories.ts`
- Modify: `packages/backend/src/test/categoryService.test.ts`
- Modify: `packages/backend/src/test/categories.test.ts`

- [ ] **Step 3.1: Add failing service test**

Add this test to the `describe('categoryService', ...)` block inside `packages/backend/src/test/categoryService.test.ts`. Add the import for `transactions` at the top alongside the existing imports:

```typescript
import { users, categories, transactions } from '../db/schema/index.js';
```

Add this import alongside the existing categoryService imports:

```typescript
import {
  // existing imports...
  CategoryHasTransactionsError,
} from '../categories/categoryService.js';
```

Add this test at the end of the `describe('categoryService', ...)` block:

```typescript
it('deleteCategory throws CategoryHasTransactionsError when transactions exist', () => {
  const { db, sqlite, user } = setup();
  try {
    const cat = createCategory(db, user.id, 'Food');
    db.insert(transactions).values({
      userId: user.id,
      categoryId: cat.id,
      title: 'Groceries',
      amount: 45.50,
      currency: 'USD',
      transactionDate: '2026-05-01',
      notes: null,
    }).run();
    expect(() => deleteCategory(db, user.id, cat.id)).toThrow(CategoryHasTransactionsError);
  } finally {
    sqlite.close();
  }
});
```

- [ ] **Step 3.2: Run test — expect FAIL**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|CategoryHasTransactions"
```

Expected: FAIL with "CategoryHasTransactionsError is not exported"

- [ ] **Step 3.3: Update categoryService.ts**

Replace the full contents of `packages/backend/src/categories/categoryService.ts`:

```typescript
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
```

- [ ] **Step 3.4: Add failing API integration test**

Add this test at the end of the `describe('Categories API', ...)` block in `packages/backend/src/test/categories.test.ts`:

```typescript
it('DELETE /api/categories/:id returns 409 when category has transactions', async () => {
  const { cookie } = await loginAs(server.url, 'pete@example.com', 'Pete');

  const catRes = await fetch(`${server.url}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: 'WithTx' }),
  });
  const cat = (await catRes.json()) as { id: number };

  await fetch(`${server.url}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: 'Blocking Tx',
      amount: 10,
      currency: 'USD',
      transactionDate: '2026-05-01',
      categoryId: cat.id,
    }),
  });

  const res = await fetch(`${server.url}/api/categories/${cat.id}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  expect(res.status).toBe(409);
  const body = (await res.json()) as { error: { code: string } };
  expect(body.error.code).toBe('CONFLICT');
});
```

- [ ] **Step 3.5: Run test — expect FAIL**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|409|WithTx"
```

Expected: FAIL — the `/api/transactions` route doesn't exist yet so the transaction is not created, meaning the DELETE returns 204, not 409.

Note: This test will still fail in Step 3.5 because the `/api/transactions` route isn't registered yet. It will pass after Task 4 is complete. Continue to Step 3.6 to wire the error in the categories router.

- [ ] **Step 3.6: Update categories router to handle CategoryHasTransactionsError**

In `packages/backend/src/routes/categories.ts`, update the import line to include the new error class:

```typescript
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  DuplicateCategoryNameError,
  CategoryNotFoundError,
  CategoryHasTransactionsError,
} from '../categories/categoryService.js';
```

Then in the DELETE handler, add the new error case before `next(err)`:

```typescript
router.delete('/:id', validateRequest({ params: CategoryParamsSchema }), (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
  }
  try {
    deleteCategory(db, req.user.id, Number(req.params.id));
    return res.status(204).send();
  } catch (err) {
    if (err instanceof CategoryNotFoundError) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
    }
    if (err instanceof CategoryHasTransactionsError) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, details: {} } });
    }
    next(err);
  }
});
```

- [ ] **Step 3.7: Run service unit tests — expect PASS**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | grep -E "categoryService|PASS|FAIL"
```

Expected: The `categoryService` describe block PASSES including the new `CategoryHasTransactionsError` test. The API integration test added in Step 3.4 still fails (transaction route not wired yet — that is expected and will be fixed in Task 4).

- [ ] **Step 3.8: Commit**

```bash
git add packages/backend/src/categories/categoryService.ts packages/backend/src/routes/categories.ts packages/backend/src/test/categoryService.test.ts packages/backend/src/test/categories.test.ts
git commit -m "feat: block category deletion when transactions exist"
```

---

## Task 4: Transaction API Routes + Integration Tests

**Files:**
- Create: `packages/backend/src/test/transactions.test.ts`
- Create: `packages/backend/src/routes/transactions.ts`
- Modify: `packages/backend/src/app.ts`

- [ ] **Step 4.1: Write failing integration tests**

Create `packages/backend/src/test/transactions.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, type TestServer } from './server.js';

function extractSessionCookie(res: Response): string {
  const header = res.headers.get('set-cookie') ?? '';
  const match = header.match(/connect\.sid=[^;]+/);
  return match ? match[0] : '';
}

async function loginAs(url: string, email: string, displayName: string): Promise<{ cookie: string; userId: number }> {
  const res = await fetch(`${url}/api/auth/test/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { id: number };
  return { cookie: extractSessionCookie(res), userId: body.id };
}

async function setupUserWithCategory(
  url: string,
  email: string,
  name: string,
  categoryName: string,
): Promise<{ cookie: string; userId: number; categoryId: number }> {
  const { cookie, userId } = await loginAs(url, email, name);
  const catRes = await fetch(`${url}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: categoryName }),
  });
  const cat = (await catRes.json()) as { id: number };
  return { cookie, userId, categoryId: cat.id };
}

function txBody(categoryId: number) {
  return {
    title: 'Groceries',
    amount: 45.50,
    currency: 'USD',
    transactionDate: '2026-05-01',
    categoryId,
    notes: 'weekly shop',
  };
}

describe('Transactions API', () => {
  let server: TestServer;

  beforeAll(async () => { server = await startTestServer(); });
  afterAll(async () => { await server.close(); });

  // --- auth guard ---

  it('GET /api/transactions returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/transactions`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/transactions returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test', amount: 10, currency: 'USD', transactionDate: '2026-05-01', categoryId: 1 }),
    });
    expect(res.status).toBe(401);
  });

  // --- create ---

  it('POST /api/transactions creates a transaction and returns 201', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'alice-tx1@ex.com', 'Alice1', 'Food');
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(categoryId)),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; title: string; amount: number; categoryId: number; currency: string };
    expect(body.id).toBeTypeOf('number');
    expect(body.title).toBe('Groceries');
    expect(body.amount).toBe(45.50);
    expect(body.categoryId).toBe(categoryId);
    expect(body.currency).toBe('USD');
  });

  it('POST /api/transactions returns 400 for empty title', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'alice-tx2@ex.com', 'Alice2', 'Food');
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/transactions returns 400 for non-positive amount', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'alice-tx3@ex.com', 'Alice3', 'Food');
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), amount: -5 }),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/transactions returns 400 for invalid date format', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'alice-tx4@ex.com', 'Alice4', 'Food');
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), transactionDate: '01/05/2026' }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/transactions returns 400 when categoryId belongs to another user", async () => {
    const { cookie } = await setupUserWithCategory(server.url, 'bob-tx1@ex.com', 'Bob1', 'Food');
    const { categoryId: otherCatId } = await setupUserWithCategory(server.url, 'carol-tx1@ex.com', 'Carol1', 'Food');
    const res = await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(otherCatId)),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  // --- list + filters ---

  it('GET /api/transactions returns empty array for new user', async () => {
    const { cookie } = await loginAs(server.url, 'new-tx1@ex.com', 'NewUser1');
    const res = await fetch(`${server.url}/api/transactions`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const list = (await res.json()) as unknown[];
    expect(Array.isArray(list)).toBe(true);
    expect(list).toHaveLength(0);
  });

  it('GET /api/transactions returns only the authenticated user\'s transactions', async () => {
    const { cookie: cookieA, categoryId: catA } = await setupUserWithCategory(server.url, 'dave-tx1@ex.com', 'Dave1', 'Food');
    const { cookie: cookieB } = await setupUserWithCategory(server.url, 'eve-tx1@ex.com', 'Eve1', 'Food');
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify(txBody(catA)),
    });
    const res = await fetch(`${server.url}/api/transactions`, { headers: { Cookie: cookieB } });
    const list = (await res.json()) as unknown[];
    expect(list).toHaveLength(0);
  });

  it('GET /api/transactions?search= filters by title', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'frank-tx1@ex.com', 'Frank1', 'Food');
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Grocery Store' }),
    });
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Gas Station' }),
    });
    const res = await fetch(`${server.url}/api/transactions?search=Grocery`, { headers: { Cookie: cookie } });
    const list = (await res.json()) as { title: string }[];
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('Grocery Store');
  });

  it('GET /api/transactions?categoryId= filters by category', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'grace-tx1@ex.com', 'Grace1', 'Food');
    const catRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Transport' }),
    });
    const cat2 = (await catRes.json()) as { id: number };
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Groceries' }),
    });
    await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(cat2.id), title: 'Bus pass' }),
    });
    const res = await fetch(`${server.url}/api/transactions?categoryId=${categoryId}`, { headers: { Cookie: cookie } });
    const list = (await res.json()) as { title: string }[];
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe('Groceries');
  });

  // --- update ---

  it('PUT /api/transactions/:id updates a transaction', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'hank-tx1@ex.com', 'Hank1', 'Food');
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(categoryId)),
    });
    const created = (await createRes.json()) as { id: number };
    const res = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ ...txBody(categoryId), title: 'Updated Title', amount: 99 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { title: string; amount: number };
    expect(body.title).toBe('Updated Title');
    expect(body.amount).toBe(99);
  });

  it('PUT /api/transactions/:id returns 404 when transaction belongs to another user', async () => {
    const { cookie: cookieA, categoryId: catA } = await setupUserWithCategory(server.url, 'ivy-tx1@ex.com', 'Ivy1', 'Food');
    const { cookie: cookieB, categoryId: catB } = await setupUserWithCategory(server.url, 'judy-tx1@ex.com', 'Judy1', 'Food');
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify(txBody(catA)),
    });
    const created = (await createRes.json()) as { id: number };
    const res = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify(txBody(catB)),
    });
    expect(res.status).toBe(404);
  });

  // --- delete ---

  it('DELETE /api/transactions/:id deletes a transaction and returns 204', async () => {
    const { cookie, categoryId } = await setupUserWithCategory(server.url, 'karl-tx1@ex.com', 'Karl1', 'Food');
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(txBody(categoryId)),
    });
    const created = (await createRes.json()) as { id: number };
    const deleteRes = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'DELETE', headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(204);
    const listRes = await fetch(`${server.url}/api/transactions`, { headers: { Cookie: cookie } });
    const list = (await listRes.json()) as { id: number }[];
    expect(list.find((t) => t.id === created.id)).toBeUndefined();
  });

  it('DELETE /api/transactions/:id returns 404 when transaction belongs to another user', async () => {
    const { cookie: cookieA, categoryId: catA } = await setupUserWithCategory(server.url, 'leo-tx1@ex.com', 'Leo1', 'Food');
    const { cookie: cookieB } = await setupUserWithCategory(server.url, 'mia-tx1@ex.com', 'Mia1', 'Food');
    const createRes = await fetch(`${server.url}/api/transactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify(txBody(catA)),
    });
    const created = (await createRes.json()) as { id: number };
    const res = await fetch(`${server.url}/api/transactions/${created.id}`, {
      method: 'DELETE', headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 4.2: Run tests — expect FAIL**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|transactions API|401"
```

Expected: FAIL — routes don't exist yet, all return 404.

- [ ] **Step 4.3: Create the transactions router**

Create `packages/backend/src/routes/transactions.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionNotFoundError,
  CategoryNotOwnedError,
  type TransactionFilters,
  type TransactionInput,
} from '../transactions/transactionService.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

const TransactionBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  categoryId: z.number().int().positive(),
  notes: z.string().max(1000).nullable().optional(),
});

const TransactionParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const TransactionQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountMin: z.coerce.number().positive().optional(),
  amountMax: z.coerce.number().positive().optional(),
});

const UNAUTHORIZED = { error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } };

export function createTransactionsRouter(db: Db): Router {
  const router = Router();

  router.get('/', validateRequest({ query: TransactionQuerySchema }), (req, res) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    const filters = req.query as TransactionFilters;
    return res.json(listTransactions(db, req.user.id, filters));
  });

  router.post('/', validateRequest({ body: TransactionBodySchema }), (req, res, next) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    try {
      const input = req.body as TransactionInput;
      const tx = createTransaction(db, req.user.id, input);
      return res.status(201).json(tx);
    } catch (err) {
      if (err instanceof CategoryNotOwnedError) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  router.put('/:id', validateRequest({ params: TransactionParamsSchema, body: TransactionBodySchema }), (req, res, next) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    try {
      const input = req.body as TransactionInput;
      const tx = updateTransaction(db, req.user.id, Number(req.params.id), input);
      return res.json(tx);
    } catch (err) {
      if (err instanceof TransactionNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      if (err instanceof CategoryNotOwnedError) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  router.delete('/:id', validateRequest({ params: TransactionParamsSchema }), (req, res, next) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    try {
      deleteTransaction(db, req.user.id, Number(req.params.id));
      return res.status(204).send();
    } catch (err) {
      if (err instanceof TransactionNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  return router;
}
```

- [ ] **Step 4.4: Register the router in app.ts**

In `packages/backend/src/app.ts`, add the import and mount:

```typescript
import { createTransactionsRouter } from './routes/transactions.js';
```

Add after the categories router line:
```typescript
app.use('/api/transactions', createTransactionsRouter(db));
```

The full updated `app.ts`:

```typescript
import express, { type Application } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import passport from 'passport';
import { logger } from './logger.js';
import { healthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { createCategoriesRouter } from './routes/categories.js';
import { createTransactionsRouter } from './routes/transactions.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSessionMiddleware } from './auth/session.js';
import { registerStrategies } from './auth/strategies.js';
import { getDb } from './db/connection.js';
import { env } from './env.js';

export function createApp(db = getDb()): Application {
  const app = express();

  registerStrategies(db);

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(createSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/health', healthRouter);
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/categories', createCategoriesRouter(db));
  app.use('/api/transactions', createTransactionsRouter(db));

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found', details: {} },
    });
  });

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 4.5: Run all backend tests — expect PASS**

```bash
cd packages/backend && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests PASS, including the Task 3 API test (categories 409) and all new transaction API tests.

- [ ] **Step 4.6: Commit**

```bash
git add packages/backend/src/routes/transactions.ts packages/backend/src/app.ts packages/backend/src/test/transactions.test.ts
git commit -m "feat: add transactions API routes with CRUD and filters"
```

---

## Task 5: Frontend Transactions Lib

**Files:**
- Create: `packages/frontend/src/lib/transactions.ts`

- [ ] **Step 5.1: Create the transactions API lib**

Create `packages/frontend/src/lib/transactions.ts`:

```typescript
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
```

- [ ] **Step 5.2: Run backend tests to confirm no regressions**

```bash
cd packages/backend && npm test 2>&1 | tail -10
```

Expected: All PASS.

- [ ] **Step 5.3: Commit**

```bash
git add packages/frontend/src/lib/transactions.ts
git commit -m "feat: add frontend transactions API lib"
```

---

## Task 6: TransactionsPage — List + Loading/Empty/Error + Component Tests

**Files:**
- Create: `packages/frontend/src/pages/TransactionsPage.tsx`
- Create: `packages/frontend/src/test/TransactionsPage.test.tsx`

- [ ] **Step 6.1: Write failing component tests (list, states)**

Create `packages/frontend/src/test/TransactionsPage.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TransactionsPage from '../pages/TransactionsPage.tsx';
import * as txLib from '../lib/transactions.ts';
import * as catLib from '../lib/categories.ts';
import type { Transaction } from '../lib/transactions.ts';
import type { Category } from '../lib/categories.ts';

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1, userId: 42, name: 'Food',
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1, userId: 42, categoryId: 1, title: 'Groceries',
    amount: 45.50, currency: 'USD', transactionDate: '2026-05-01',
    notes: null, createdAt: '2026-05-01T00:00:00.000Z', updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <TransactionsPage />
    </MemoryRouter>,
  );
}

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory()]);
  });

  it('shows loading state while fetching', () => {
    vi.spyOn(txLib, 'listTransactions').mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when there are no transactions', async () => {
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    vi.spyOn(txLib, 'listTransactions').mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/failed to load transactions/i)).toBeInTheDocument();
    });
  });

  it('renders a list of transactions', async () => {
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ id: 1, title: 'Groceries', amount: 45.50, transactionDate: '2026-05-01' }),
      makeTransaction({ id: 2, title: 'Gas Station', amount: 52.00, transactionDate: '2026-05-02' }),
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Gas Station')).toBeInTheDocument();
      expect(screen.getByText('$45.50')).toBeInTheDocument();
      expect(screen.getByText('$52.00')).toBeInTheDocument();
    });
  });

  it('shows transaction date and category name in list', async () => {
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ title: 'Dinner', categoryId: 1, transactionDate: '2026-05-05' }),
    ]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('2026-05-05')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
  });

  it('has an "Add Transaction" button', async () => {
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 6.2: Run tests — expect FAIL**

```bash
cd packages/frontend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|TransactionsPage"
```

Expected: FAIL — cannot find module `../pages/TransactionsPage.tsx`

- [ ] **Step 6.3: Create TransactionsPage with list + states (no form yet)**

Create `packages/frontend/src/pages/TransactionsPage.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { z } from 'zod';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type Transaction,
  type TransactionFilters,
  type TransactionInput,
} from '../lib/transactions.ts';
import { listCategories, type Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';
import ConfirmButton from '../components/ConfirmButton.tsx';

// ---- Zod schema for the form ----

const TransactionFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  amount: z.coerce.number({ invalid_type_error: 'Amount must be a number' }).positive('Must be greater than 0'),
  currency: z.string().length(3).default('USD'),
  transactionDate: z.string().min(1, 'Date is required'),
  categoryId: z.coerce.number({ invalid_type_error: 'Select a category' }).int().positive('Select a category'),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

type FormData = {
  title: string;
  amount: string;
  currency: string;
  transactionDate: string;
  categoryId: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const today = new Date().toISOString().split('T')[0]!;

const EMPTY_FORM: FormData = {
  title: '',
  amount: '',
  currency: 'USD',
  transactionDate: today,
  categoryId: '',
  notes: '',
};

function toFormData(tx: Transaction): FormData {
  return {
    title: tx.title,
    amount: String(tx.amount),
    currency: tx.currency,
    transactionDate: tx.transactionDate,
    categoryId: String(tx.categoryId),
    notes: tx.notes ?? '',
  };
}

// ---- Component ----

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then(setCats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setStatus('loading');
    listTransactions(filters)
      .then((data) => { setTxns(data); setStatus('idle'); })
      .catch(() => setStatus('error'));
  }, [filters]);

  function getCategoryName(categoryId: number): string {
    return cats.find((c) => c.id === categoryId)?.name ?? '—';
  }

  function openCreate() {
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditTarget(tx);
    setFormData(toFormData(tx));
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors({});

    const result = TransactionFormSchema.safeParse(formData);
    if (!result.success) {
      const errs: FormErrors = {};
      for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
        errs[field as keyof FormErrors] = (msgs as string[])[0];
      }
      setFormErrors(errs);
      return;
    }

    const input: TransactionInput = {
      title: result.data.title,
      amount: result.data.amount,
      currency: result.data.currency,
      transactionDate: result.data.transactionDate,
      categoryId: result.data.categoryId,
      notes: result.data.notes || null,
    };

    try {
      if (editTarget) {
        const updated = await updateTransaction(editTarget.id, input);
        setTxns((prev) => prev.map((t) => (t.id === editTarget.id ? updated : t)));
      } else {
        const created = await createTransaction(input);
        setTxns((prev) => [created, ...prev]);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save transaction');
    }
  }

  function field(id: string, label: string, children: React.ReactNode, error?: string) {
    return (
      <div>
        <label htmlFor={id} className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1">
          {label}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-raised text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm';

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-gray-400 dark:text-dark-text-muted">Loading...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-8 text-center text-red-600 dark:text-red-400">
        Failed to load transactions. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-dark-text">Transactions</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 dark:text-dark-text-muted">{txns.length} transactions</span>
          <button
            onClick={openCreate}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search ?? ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filters.categoryId ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value ? Number(e.target.value) : undefined }))}
          className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All categories</option>
          {cats.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
          className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Date from"
        />
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
          className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Date to"
        />
        <input
          type="number"
          placeholder="Min $"
          min="0"
          step="0.01"
          value={filters.amountMin ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, amountMin: e.target.value ? Number(e.target.value) : undefined }))}
          className="w-24 py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <input
          type="number"
          placeholder="Max $"
          min="0"
          step="0.01"
          value={filters.amountMax ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, amountMax: e.target.value ? Number(e.target.value) : undefined }))}
          className="w-24 py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => setFilters({})}
            className="py-2 px-3 text-sm rounded-lg border border-gray-200 dark:border-dark-border text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors flex items-center gap-1"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Transaction list */}
      {txns.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-dark-text-secondary">
          {Object.values(filters).some(Boolean) ? 'No matching transactions.' : 'No transactions yet.'}
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-muted">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-muted">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-dark-text-muted">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-dark-text-muted">Amount</th>
                <th className="px-4 py-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-gray-100 dark:border-dark-raised last:border-0 bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors"
                >
                  <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary whitespace-nowrap">
                    {tx.transactionDate}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-dark-text">
                    <div>{tx.title}</div>
                    {tx.notes && (
                      <div className="text-xs text-gray-400 dark:text-dark-text-muted truncate max-w-[200px]">
                        {tx.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-dark-text-secondary">
                    {getCategoryName(tx.categoryId)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                    ${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(tx)}
                        aria-label="Edit"
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <ConfirmButton
                        icon={Trash2}
                        iconLabel="Delete"
                        onConfirm={async () => {
                          try {
                            await deleteTransaction(tx.id);
                            setTxns((prev) => prev.filter((t) => t.id !== tx.id));
                          } catch (err) {
                            throw err instanceof ApiError ? new Error(err.message) : new Error('Failed to delete transaction');
                          }
                        }}
                        confirmMessage="Delete this transaction?"
                        isDangerous
                        className="p-1.5"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-dark-surface rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                {editTarget ? 'Edit Transaction' : 'New Transaction'}
              </h3>
              <button
                onClick={closeForm}
                aria-label="Close"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:text-dark-text-muted dark:hover:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-raised transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {field('tx-title', 'Title', (
                <input
                  id="tx-title"
                  type="text"
                  placeholder="e.g. Grocery Store"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  className={inputClass}
                />
              ), formErrors.title)}

              {field('tx-amount', 'Amount', (
                <div className="flex gap-2">
                  <input
                    id="tx-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                    className={`${inputClass} flex-1`}
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((f) => ({ ...f, currency: e.target.value }))}
                    className={`${inputClass} w-24`}
                    aria-label="Currency"
                  >
                    <option value="USD">USD</option>
                  </select>
                </div>
              ), formErrors.amount)}

              {field('tx-date', 'Date', (
                <input
                  id="tx-date"
                  type="date"
                  value={formData.transactionDate}
                  onChange={(e) => setFormData((f) => ({ ...f, transactionDate: e.target.value }))}
                  className={inputClass}
                />
              ), formErrors.transactionDate)}

              {field('tx-category', 'Category', (
                <select
                  id="tx-category"
                  value={formData.categoryId}
                  onChange={(e) => setFormData((f) => ({ ...f, categoryId: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Select a category</option>
                  {cats.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              ), formErrors.categoryId)}

              {field('tx-notes', 'Notes (optional)', (
                <textarea
                  id="tx-notes"
                  rows={3}
                  placeholder="Optional note..."
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className={inputClass}
                />
              ))}

              {formError && (
                <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                >
                  {editTarget ? 'Save Changes' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6.4: Run frontend tests — expect PASS**

```bash
cd packages/frontend && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests PASS.

- [ ] **Step 6.5: Commit**

```bash
git add packages/frontend/src/pages/TransactionsPage.tsx packages/frontend/src/test/TransactionsPage.test.tsx
git commit -m "feat: add TransactionsPage with list, states, form modal, and filters"
```

---

## Task 7: Transaction Form Interactions + Delete Tests

**Files:**
- Modify: `packages/frontend/src/test/TransactionsPage.test.tsx`

- [ ] **Step 7.1: Add form and delete interaction tests**

Append these tests to the `describe('TransactionsPage', ...)` block in `packages/frontend/src/test/TransactionsPage.test.tsx`:

```typescript
import userEvent from '@testing-library/user-event';
import { ApiError } from '../lib/apiClient.ts';
```

Add these imports at the top of the test file alongside the existing imports:

```typescript
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { ApiError } from '../lib/apiClient.ts';
```

Add these test cases inside the describe block:

```typescript
  it('opens create form when "Add Transaction" is clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(screen.getByRole('heading', { name: /new transaction/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('creates a transaction and adds it to the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);
    vi.spyOn(txLib, 'createTransaction').mockResolvedValue(
      makeTransaction({ id: 10, title: 'New Expense', amount: 30, categoryId: 1 }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'New Expense');
    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '30');
    await user.selectOptions(screen.getByLabelText('Category'), '1');

    await user.click(screen.getByRole('button', { name: /add transaction/i, hidden: false }));

    await waitFor(() => {
      expect(txLib.createTransaction).toHaveBeenCalled();
      expect(screen.getByText('New Expense')).toBeInTheDocument();
    });
  });

  it('shows validation error when title is empty on submit', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('opens edit form pre-populated with transaction data', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ id: 5, title: 'Coffee', amount: 5.50, transactionDate: '2026-05-05', categoryId: 1 }),
    ]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);

    renderPage();
    await waitFor(() => expect(screen.getByText('Coffee')).toBeInTheDocument());

    const row = screen.getByText('Coffee').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /edit transaction/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue('Coffee')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5.5')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2026-05-05')).toBeInTheDocument();
    });
  });

  it('updates a transaction and reflects change in list', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ id: 7, title: 'Old Title', amount: 20, categoryId: 1 }),
    ]);
    vi.spyOn(catLib, 'listCategories').mockResolvedValue([makeCategory({ id: 1, name: 'Food' })]);
    vi.spyOn(txLib, 'updateTransaction').mockResolvedValue(
      makeTransaction({ id: 7, title: 'New Title', amount: 20, categoryId: 1 }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Old Title')).toBeInTheDocument());

    const row = screen.getByText('Old Title').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /edit/i }));

    await waitFor(() => expect(screen.getByRole('heading', { name: /edit transaction/i })).toBeInTheDocument());

    const titleInput = screen.getByDisplayValue('Old Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'New Title');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(txLib.updateTransaction).toHaveBeenCalledWith(7, expect.objectContaining({ title: 'New Title' }));
      expect(screen.getByText('New Title')).toBeInTheDocument();
      expect(screen.queryByText('Old Title')).not.toBeInTheDocument();
    });
  });

  it('closes form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);

    renderPage();
    await waitFor(() => expect(screen.getByText(/no transactions yet/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /add transaction/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: /new transaction/i })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('heading', { name: /new transaction/i })).not.toBeInTheDocument();
  });

  it('deletes a transaction and removes it from the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(txLib, 'listTransactions').mockResolvedValue([
      makeTransaction({ id: 9, title: 'To Delete', categoryId: 1 }),
    ]);
    vi.spyOn(txLib, 'deleteTransaction').mockResolvedValue(undefined);

    renderPage();
    await waitFor(() => expect(screen.getByText('To Delete')).toBeInTheDocument());

    const row = screen.getByText('To Delete').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(screen.getByText('Delete this transaction?')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(txLib.deleteTransaction).toHaveBeenCalledWith(9);
      expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
    });
  });
```

- [ ] **Step 7.2: Run tests — expect PASS**

```bash
cd packages/frontend && npm test -- --reporter=verbose 2>&1 | tail -40
```

Expected: All tests PASS. If any test fails due to selector mismatches (e.g. button name collision between the page button and the form button), inspect the output, adjust the `getByRole` selector to be more specific (e.g. scoping to the modal's containing element), then re-run.

- [ ] **Step 7.3: Commit**

```bash
git add packages/frontend/src/test/TransactionsPage.test.tsx
git commit -m "test: add transaction form and delete interaction tests"
```

---

## Task 8: App.tsx — Transactions Navigation + Route

**Files:**
- Modify: `packages/frontend/src/App.tsx`
- Modify: `packages/frontend/src/test/App.test.tsx`

- [ ] **Step 8.1: Write a failing routing test**

Read the current contents of `packages/frontend/src/test/App.test.tsx`, then append a new test that checks the `/transactions` route renders the Transactions heading. Here is a representative test to add (adjust to match the existing test file's pattern):

```typescript
it('renders TransactionsPage for /transactions', async () => {
  // Mock auth to return a logged-in user
  vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue({
    id: 1, provider: 'test', email: 'a@test.com', displayName: 'Alice', avatarUrl: null,
  });
  // Mock transactions lib to return empty list
  vi.spyOn(txLib, 'listTransactions').mockResolvedValue([]);
  vi.spyOn(catLib, 'listCategories').mockResolvedValue([]);

  render(
    <MemoryRouter initialEntries={['/transactions']}>
      <App />
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /transactions/i })).toBeInTheDocument();
  });
});
```

Add the necessary imports (`txLib`, `catLib`) at the top of `App.test.tsx` alongside existing imports, then run the test:

```bash
cd packages/frontend && npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|transactions"
```

Expected: FAIL — route `/transactions` does not exist yet.

- [ ] **Step 8.2: Update App.tsx**

In `packages/frontend/src/App.tsx`, add the import:

```typescript
import TransactionsPage from './pages/TransactionsPage.tsx';
```

In `AppShell`, add the nav link after the `Categories` link:

```typescript
<NavLink
  to="/transactions"
  className={({ isActive }) =>
    isActive
      ? 'px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-dark-raised text-emerald-600 dark:text-emerald-400 font-medium text-sm'
      : 'px-3 py-1.5 rounded-lg text-gray-500 dark:text-dark-text-muted hover:text-gray-700 dark:hover:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-raised transition-colors text-sm'
  }
>
  Transactions
</NavLink>
```

In `AppShell`'s `<Routes>`, add the route after the `/categories` route:

```typescript
<Route
  path="/transactions"
  element={
    <ProtectedRoute>
      <TransactionsPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 8.3: Run all frontend tests — expect PASS**

```bash
cd packages/frontend && npm test -- --reporter=verbose 2>&1 | tail -30
```

Expected: All tests PASS.

- [ ] **Step 8.4: Run all backend tests — confirm no regressions**

```bash
cd packages/backend && npm test 2>&1 | tail -10
```

Expected: All PASS.

- [ ] **Step 8.5: Commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/test/App.test.tsx
git commit -m "feat: add Transactions nav link and route to app"
```

---

## Self-Review

### Spec Coverage Check

| Requirement | Covered By |
|---|---|
| Transaction CRUD (create, edit, delete) | Tasks 2–4, 6–7 |
| Validate title (required, max 200) | Tasks 2, 4 |
| Validate amount (positive number) | Tasks 2, 4 |
| Validate transaction date (YYYY-MM-DD) | Tasks 2, 4 |
| Validate category ownership | Tasks 2, 4 |
| Validate notes (max 1000, optional) | Task 2 |
| Explicit currency (USD) | Tasks 1–4, 6 |
| Search by title/notes | Tasks 2, 4 |
| Filter by category | Tasks 2, 4, 6 |
| Filter by date range | Tasks 2, 4, 6 |
| Filter by amount range | Tasks 2, 4, 6 |
| Block category deletion when transactions exist | Task 3 |
| Cross-user data isolation | Tasks 2, 4 |
| Auth guards on all routes | Task 4 |
| Loading state | Task 6 |
| Empty state (no results / no match) | Task 6 |
| Error state | Task 6 |
| Create/edit form with client validation | Tasks 6–7 |
| Delete with confirmation | Tasks 6–7 |
| Transactions nav link | Task 8 |

All Stage 3 spec requirements are covered.

### Placeholder Scan

No TBD, TODO, or vague instructions remain. Every step includes exact file paths, exact code, and exact commands.

### Type Consistency Check

- `Transaction` type in `transactionService.ts` exports `transactionDate: string` — matches the `text('transaction_date')` schema column.
- `TransactionInput.notes` is `string | null | undefined` in service; `TransactionFormSchema` produces `string | undefined` which is coerced to `null` before the API call — consistent.
- `CategoryNotOwnedError` class name is consistent across `transactionService.ts`, `routes/transactions.ts`, and test files.
- `CategoryHasTransactionsError` class name is consistent across `categoryService.ts`, `routes/categories.ts`, and test files.
- `listTransactions` filter type `TransactionFilters` is exported from service and reused in the route handler cast.
