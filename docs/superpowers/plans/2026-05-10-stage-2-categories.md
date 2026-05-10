# Stage 2: Categories — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full category CRUD for authenticated users — backend schema, migration, service, API routes, frontend API lib, CategoriesPage component, and routing — using TDD throughout.

**Architecture:** A `categories` table is added to the SQLite schema with a unique constraint on `(userId, name)`. A `categoryService.ts` module encapsulates all DB queries and throws typed errors (`DuplicateCategoryNameError`, `CategoryNotFoundError`); a thin `categories.ts` router delegates to it and enforces auth. The frontend gains a typed `categories.ts` lib module and a `CategoriesPage` component wired into `App.tsx`.

**Tech Stack:** Express, TypeScript, Drizzle ORM, better-sqlite3, Zod, Vitest (backend); React 18, Vite, TypeScript, Tailwind, React Router v6, Vitest + Testing Library (frontend).

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `packages/backend/src/db/schema/index.ts` | Modify | Add `categories` table |
| `packages/backend/src/db/migrations/0001_<slug>.sql` | Generate | SQL migration (via `db:generate`) |
| `packages/backend/src/categories/categoryService.ts` | Create | All category DB logic |
| `packages/backend/src/routes/categories.ts` | Create | Thin Express router |
| `packages/backend/src/app.ts` | Modify | Register categories router |
| `packages/backend/src/test/categoryService.test.ts` | Create | Schema + service unit tests |
| `packages/backend/src/test/categories.test.ts` | Create | API integration tests |
| `packages/frontend/src/lib/apiClient.ts` | Modify | Handle 204 No Content responses |
| `packages/frontend/src/lib/categories.ts` | Create | Typed API helper functions |
| `packages/frontend/src/pages/CategoriesPage.tsx` | Create | Management UI |
| `packages/frontend/src/test/CategoriesPage.test.tsx` | Create | Component tests |
| `packages/frontend/src/App.tsx` | Modify | Add `/categories` route + nav link |
| `packages/frontend/src/test/App.test.tsx` | Modify | Add routing test |

---

## Task 1: Categories DB Schema + Schema Unit Tests

**Files:**
- Modify: `packages/backend/src/db/schema/index.ts`
- Create: `packages/backend/src/test/categoryService.test.ts` (schema portion)
- Generate: `packages/backend/src/db/migrations/0001_<slug>.sql`

- [ ] **Step 1.1: Add categories table to the schema**

Replace the full contents of `packages/backend/src/db/schema/index.ts`:

```typescript
import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
```

- [ ] **Step 1.2: Write the failing schema unit tests**

Create `packages/backend/src/test/categoryService.test.ts`:

```typescript
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
```

- [ ] **Step 1.3: Run schema tests to confirm they fail (no migration yet)**

Run inside `packages/backend`:

```
npm test -- --reporter=verbose src/test/categoryService.test.ts
```

Expected: all three tests fail with `no such table: categories`.

- [ ] **Step 1.4: Generate the migration**

Run inside `packages/backend`:

```
npm run db:generate
```

Expected output includes:
```
[✓] Your SQL migration file ➜ src/db/migrations/0001_<some_slug>.sql
```

Open the generated `.sql` file and verify it contains `CREATE TABLE \`categories\`` and `CREATE UNIQUE INDEX \`categories_user_id_name_idx\``.

- [ ] **Step 1.5: Run schema tests to confirm they pass**

Run inside `packages/backend`:

```
npm test -- --reporter=verbose src/test/categoryService.test.ts
```

Expected:
```
✓ categories table > can insert and retrieve a category
✓ categories table > rejects duplicate name for the same user
✓ categories table > allows the same name for different users
```

- [ ] **Step 1.6: Commit**

```bash
git add packages/backend/src/db/schema/index.ts packages/backend/src/db/migrations packages/backend/src/test/categoryService.test.ts
git commit -m "feat: add categories schema, migration, and schema unit tests"
```

---

## Task 2: Backend Categories API Integration Tests (All Failing)

**Files:**
- Create: `packages/backend/src/test/categories.test.ts`

Write all integration tests before the service or router exists. All tests will fail with 404.

- [ ] **Step 2.1: Create the integration test file**

Create `packages/backend/src/test/categories.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, type TestServer } from './server.js';

function extractSessionCookie(res: Response): string {
  const header = res.headers.get('set-cookie') ?? '';
  const match = header.match(/connect\.sid=[^;]+/);
  return match ? match[0] : '';
}

async function loginAs(
  url: string,
  email: string,
  displayName: string,
): Promise<{ cookie: string; userId: number }> {
  const res = await fetch(`${url}/api/auth/test/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, displayName }),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { id: number };
  return { cookie: extractSessionCookie(res), userId: body.id };
}

describe('Categories API', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  // --- auth guard ---

  it('GET /api/categories returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/categories`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/categories returns 401 when not authenticated', async () => {
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Food' }),
    });
    expect(res.status).toBe(401);
  });

  // --- list ---

  it('GET /api/categories returns empty array for new user', async () => {
    const { cookie } = await loginAs(server.url, 'alice@example.com', 'Alice');
    const res = await fetch(`${server.url}/api/categories`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const body = (await res.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
  });

  // --- create ---

  it('POST /api/categories creates a category and returns 201', async () => {
    const { cookie } = await loginAs(server.url, 'bob@example.com', 'Bob');
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Groceries' }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: number; name: string; userId: number };
    expect(body.id).toBeTypeOf('number');
    expect(body.name).toBe('Groceries');
    expect(body.userId).toBeTypeOf('number');
  });

  it('POST /api/categories returns 400 when name is empty', async () => {
    const { cookie } = await loginAs(server.url, 'carol@example.com', 'Carol');
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: '' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/categories returns 409 on duplicate name for same user', async () => {
    const { cookie } = await loginAs(server.url, 'dave@example.com', 'Dave');
    await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Transport' }),
    });
    const res = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Transport' }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CONFLICT');
  });

  it('POST /api/categories allows same name for different users', async () => {
    const { cookie: cookieE } = await loginAs(server.url, 'eve@example.com', 'Eve');
    const { cookie: cookieF } = await loginAs(server.url, 'frank@example.com', 'Frank');
    const res1 = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieE },
      body: JSON.stringify({ name: 'Health' }),
    });
    expect(res1.status).toBe(201);
    const res2 = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieF },
      body: JSON.stringify({ name: 'Health' }),
    });
    expect(res2.status).toBe(201);
  });

  it('GET /api/categories returns only the authenticated user\'s categories', async () => {
    const { cookie: cookieG } = await loginAs(server.url, 'grace@example.com', 'Grace');
    const { cookie: cookieH } = await loginAs(server.url, 'hank@example.com', 'Hank');

    await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieG },
      body: JSON.stringify({ name: 'Grace Only' }),
    });

    const res = await fetch(`${server.url}/api/categories`, { headers: { Cookie: cookieH } });
    const list = (await res.json()) as { name: string }[];
    expect(list.find((c) => c.name === 'Grace Only')).toBeUndefined();
  });

  // --- rename (PUT) ---

  it('PUT /api/categories/:id renames a category', async () => {
    const { cookie } = await loginAs(server.url, 'ivy@example.com', 'Ivy');
    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Old Name' }),
    });
    const created = (await createRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'New Name' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: number; name: string };
    expect(body.name).toBe('New Name');
    expect(body.id).toBe(created.id);
  });

  it('PUT /api/categories/:id returns 404 when category belongs to another user', async () => {
    const { cookie: cookieJ } = await loginAs(server.url, 'judy@example.com', 'Judy');
    const { cookie: cookieK } = await loginAs(server.url, 'karl@example.com', 'Karl');

    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieJ },
      body: JSON.stringify({ name: 'Judy Only' }),
    });
    const created = (await createRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieK },
      body: JSON.stringify({ name: 'Hijack' }),
    });
    expect(res.status).toBe(404);
  });

  it('PUT /api/categories/:id returns 409 when renaming to an existing name', async () => {
    const { cookie } = await loginAs(server.url, 'leo@example.com', 'Leo');
    await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Alpha' }),
    });
    const betaRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Beta' }),
    });
    const beta = (await betaRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${beta.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Alpha' }),
    });
    expect(res.status).toBe(409);
  });

  // --- delete ---

  it('DELETE /api/categories/:id deletes a category and returns 204', async () => {
    const { cookie } = await loginAs(server.url, 'mia@example.com', 'Mia');
    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: 'Temporary' }),
    });
    const created = (await createRes.json()) as { id: number };

    const deleteRes = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    expect(deleteRes.status).toBe(204);

    const listRes = await fetch(`${server.url}/api/categories`, { headers: { Cookie: cookie } });
    const list = (await listRes.json()) as { id: number }[];
    expect(list.find((c) => c.id === created.id)).toBeUndefined();
  });

  it('DELETE /api/categories/:id returns 404 when category belongs to another user', async () => {
    const { cookie: cookieN } = await loginAs(server.url, 'nina@example.com', 'Nina');
    const { cookie: cookieO } = await loginAs(server.url, 'otto@example.com', 'Otto');

    const createRes = await fetch(`${server.url}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieN },
      body: JSON.stringify({ name: 'Nina Only' }),
    });
    const created = (await createRes.json()) as { id: number };

    const res = await fetch(`${server.url}/api/categories/${created.id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieO },
    });
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2.2: Run tests to confirm all fail with 404**

Run inside `packages/backend`:

```
npm test -- --reporter=verbose src/test/categories.test.ts
```

Expected: all tests fail — most show `expected 404 to be 401/200/201/etc.` because the route does not exist.

- [ ] **Step 2.3: Commit failing tests**

```bash
git add packages/backend/src/test/categories.test.ts
git commit -m "test: add failing categories API integration tests"
```

---

## Task 3: Category Service

**Files:**
- Create: `packages/backend/src/categories/categoryService.ts`
- Modify: `packages/backend/src/test/categoryService.test.ts` (add service tests)

- [ ] **Step 3.1: Create the service**

Create `packages/backend/src/categories/categoryService.ts`:

```typescript
import { eq, and } from 'drizzle-orm';
import { categories } from '../db/schema/index.js';
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

  db.delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .run();
}
```

- [ ] **Step 3.2: Add service unit tests**

Replace the full contents of `packages/backend/src/test/categoryService.test.ts` with the merged file (schema tests from Task 1 plus new service tests):

```typescript
import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { users, categories } from '../db/schema/index.js';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  DuplicateCategoryNameError,
  CategoryNotFoundError,
} from '../categories/categoryService.js';

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

describe('categoryService', () => {
  function setup() {
    const { db, sqlite } = createTestDb();
    const [user] = db
      .insert(users)
      .values({ provider: 'test', providerUserId: 'svc-u1', email: 'svc@test.com', displayName: 'SvcUser', avatarUrl: null })
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
      expect(() => renameCategory(db, user.id, beta.id, 'Alpha')).toThrow(DuplicateCategoryNameError);
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
});
```

- [ ] **Step 3.3: Run service tests to confirm they all pass**

Run inside `packages/backend`:

```
npm test -- --reporter=verbose src/test/categoryService.test.ts
```

Expected: all 11 tests pass.

- [ ] **Step 3.4: Commit**

```bash
git add packages/backend/src/categories/categoryService.ts packages/backend/src/test/categoryService.test.ts
git commit -m "feat: implement categoryService with typed errors and unit tests"
```

---

## Task 4: Categories Router + Wire Into app.ts

**Files:**
- Create: `packages/backend/src/routes/categories.ts`
- Modify: `packages/backend/src/app.ts`

- [ ] **Step 4.1: Create the categories router**

Create `packages/backend/src/routes/categories.ts`:

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  DuplicateCategoryNameError,
  CategoryNotFoundError,
} from '../categories/categoryService.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

const CategoryBodySchema = z.object({ name: z.string().min(1).max(100) });
const CategoryParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export function createCategoriesRouter(db: Db): Router {
  const router = Router();

  router.get('/', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    return res.json(listCategories(db, req.user.id));
  });

  router.post('/', validateRequest({ body: CategoryBodySchema }), (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    try {
      const cat = createCategory(db, req.user.id, req.body.name as string);
      return res.status(201).json(cat);
    } catch (err) {
      if (err instanceof DuplicateCategoryNameError) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, details: {} } });
      }
      throw err;
    }
  });

  router.put('/:id', validateRequest({ params: CategoryParamsSchema, body: CategoryBodySchema }), (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    try {
      const cat = renameCategory(db, req.user.id, Number(req.params.id), req.body.name as string);
      return res.json(cat);
    } catch (err) {
      if (err instanceof CategoryNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      if (err instanceof DuplicateCategoryNameError) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, details: {} } });
      }
      throw err;
    }
  });

  router.delete('/:id', validateRequest({ params: CategoryParamsSchema }), (req, res) => {
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
      throw err;
    }
  });

  return router;
}
```

**Note on `Number(req.params.id)`:** After `validateRequest` parses via `z.coerce.number()`, the runtime value is already a number. TypeScript types `req.params` as `Record<string, string>` (Express constraint), so `Number()` is used to cast correctly — `Number(5) === 5`, so this is safe.

- [ ] **Step 4.2: Register the router in app.ts**

Replace the full contents of `packages/backend/src/app.ts`:

```typescript
import express, { type Application } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import passport from 'passport';
import { logger } from './logger.js';
import { healthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { createCategoriesRouter } from './routes/categories.js';
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

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found', details: {} },
    });
  });

  app.use(errorHandler);

  return app;
}
```

- [ ] **Step 4.3: Run all backend tests**

Run inside `packages/backend`:

```
npm test -- --reporter=verbose
```

Expected: all tests pass, including all 14 tests in `categories.test.ts`.

- [ ] **Step 4.4: Commit**

```bash
git add packages/backend/src/routes/categories.ts packages/backend/src/app.ts
git commit -m "feat: add categories router and wire into app"
```

---

## Task 5: Frontend API Lib — Fix apiClient for 204 + categories.ts

**Files:**
- Modify: `packages/frontend/src/lib/apiClient.ts`
- Create: `packages/frontend/src/lib/categories.ts`

- [ ] **Step 5.1: Fix apiClient.ts to handle 204 No Content**

In `packages/frontend/src/lib/apiClient.ts`, add a 204 guard inside the `request` function (after the `if (!res.ok)` block, before `return res.json()`):

```typescript
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const body = (await res.json()) as ApiErrorBody;
    logger.error('API request failed', { path, status: res.status, code: body.error.code });
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
```

- [ ] **Step 5.2: Create packages/frontend/src/lib/categories.ts**

```typescript
import { api } from './apiClient.ts';

export interface Category {
  id: number;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function listCategories(): Promise<Category[]> {
  return api.get<Category[]>('/api/categories');
}

export async function createCategory(name: string): Promise<Category> {
  return api.post<Category>('/api/categories', { name });
}

export async function renameCategory(id: number, name: string): Promise<Category> {
  return api.put<Category>(`/api/categories/${id}`, { name });
}

export async function deleteCategory(id: number): Promise<void> {
  return api.delete<void>(`/api/categories/${id}`);
}
```

- [ ] **Step 5.3: Commit**

```bash
git add packages/frontend/src/lib/apiClient.ts packages/frontend/src/lib/categories.ts
git commit -m "feat: add categories API lib and fix apiClient 204 handling"
```

---

## Task 6: CategoriesPage Component Tests (All Failing First)

**Files:**
- Create: `packages/frontend/src/test/CategoriesPage.test.tsx`

- [ ] **Step 6.1: Check @testing-library/user-event is installed**

Run inside `packages/frontend`:

```
npm list @testing-library/user-event
```

If not installed:

```
npm install --save-dev @testing-library/user-event
```

Expected: version 14.x listed.

- [ ] **Step 6.2: Create the component test file**

Create `packages/frontend/src/test/CategoriesPage.test.tsx`:

```typescript
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CategoriesPage from '../pages/CategoriesPage.tsx';
import * as categoriesLib from '../lib/categories.ts';
import type { Category } from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 1,
    userId: 42,
    name: 'Groceries',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <CategoriesPage />
    </MemoryRouter>,
  );
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state while fetching', () => {
    vi.spyOn(categoriesLib, 'listCategories').mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty state when there are no categories', async () => {
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('No categories yet.')).toBeInTheDocument();
    });
  });

  it('renders a list of categories', async () => {
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 1, name: 'Groceries' }),
      makeCategory({ id: 2, name: 'Transport' }),
    ]);
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    vi.spyOn(categoriesLib, 'listCategories').mockRejectedValue(new Error('Network error'));
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/failed to load categories/i)).toBeInTheDocument();
    });
  });

  it('creates a category and adds it to the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    vi.spyOn(categoriesLib, 'createCategory').mockResolvedValue(
      makeCategory({ id: 10, name: 'New Category' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('No categories yet.')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Category name'), 'New Category');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(categoriesLib.createCategory).toHaveBeenCalledWith('New Category');
      expect(screen.getByText('New Category')).toBeInTheDocument();
    });
  });

  it('clears the input after successful create', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    vi.spyOn(categoriesLib, 'createCategory').mockResolvedValue(
      makeCategory({ id: 11, name: 'Cleared' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('No categories yet.')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Category name');
    await user.type(input, 'Cleared');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows conflict error when create returns 409', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([]);
    vi.spyOn(categoriesLib, 'createCategory').mockRejectedValue(
      new ApiError(409, { error: { code: 'CONFLICT', message: 'A category with this name already exists', details: {} } }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('No categories yet.')).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText('Category name'), 'Duplicate');
    await user.click(screen.getByRole('button', { name: /add/i }));

    await waitFor(() => {
      expect(screen.getByText('A category with this name already exists')).toBeInTheDocument();
    });
  });

  it('deletes a category and removes it from the list', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 5, name: 'To Delete' }),
    ]);
    vi.spyOn(categoriesLib, 'deleteCategory').mockResolvedValue(undefined);

    renderPage();
    await waitFor(() => expect(screen.getByText('To Delete')).toBeInTheDocument());

    const row = screen.getByText('To Delete').closest('li')!;
    await user.click(within(row).getByRole('button', { name: /delete/i }));

    await waitFor(() => {
      expect(categoriesLib.deleteCategory).toHaveBeenCalledWith(5);
      expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
    });
  });

  it('enters rename mode and saves new name', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 7, name: 'Old Name' }),
    ]);
    vi.spyOn(categoriesLib, 'renameCategory').mockResolvedValue(
      makeCategory({ id: 7, name: 'New Name' }),
    );

    renderPage();
    await waitFor(() => expect(screen.getByText('Old Name')).toBeInTheDocument());

    const row = screen.getByText('Old Name').closest('li')!;
    await user.click(within(row).getByRole('button', { name: /rename/i }));

    const renameInput = within(row).getByDisplayValue('Old Name');
    await user.clear(renameInput);
    await user.type(renameInput, 'New Name');
    await user.click(within(row).getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(categoriesLib.renameCategory).toHaveBeenCalledWith(7, 'New Name');
      expect(screen.getByText('New Name')).toBeInTheDocument();
      expect(screen.queryByText('Old Name')).not.toBeInTheDocument();
    });
  });

  it('cancels rename without saving', async () => {
    const user = userEvent.setup();
    vi.spyOn(categoriesLib, 'listCategories').mockResolvedValue([
      makeCategory({ id: 8, name: 'Stay Same' }),
    ]);

    renderPage();
    await waitFor(() => expect(screen.getByText('Stay Same')).toBeInTheDocument());

    const row = screen.getByText('Stay Same').closest('li')!;
    await user.click(within(row).getByRole('button', { name: /rename/i }));
    await user.click(within(row).getByRole('button', { name: /cancel/i }));

    expect(screen.getByText('Stay Same')).toBeInTheDocument();
    expect(vi.mocked(categoriesLib.renameCategory)).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6.3: Run tests to confirm all fail**

Run inside `packages/frontend`:

```
npm test -- --reporter=verbose src/test/CategoriesPage.test.tsx
```

Expected: all tests fail with `Cannot find module '../pages/CategoriesPage.tsx'`.

- [ ] **Step 6.4: Commit failing tests**

```bash
git add packages/frontend/src/test/CategoriesPage.test.tsx
git commit -m "test: add failing CategoriesPage component tests"
```

---

## Task 7: CategoriesPage Implementation

**Files:**
- Create: `packages/frontend/src/pages/CategoriesPage.tsx`

- [ ] **Step 7.1: Create the page component**

Create `packages/frontend/src/pages/CategoriesPage.tsx`:

```tsx
import { useState, useEffect } from 'react';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  type Category,
} from '../lib/categories.ts';
import { ApiError } from '../lib/apiClient.ts';

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    listCategories()
      .then((data) => { setCats(data); setStatus('idle'); })
      .catch(() => setStatus('error'));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    try {
      const cat = await createCategory(newName);
      setCats((prev) => [...prev, cat]);
      setNewName('');
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'Failed to create category');
    }
  }

  async function handleDelete(id: number) {
    await deleteCategory(id);
    setCats((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleRename(id: number) {
    const updated = await renameCategory(id, renameValue);
    setCats((prev) => prev.map((c) => (c.id === id ? updated : c)));
    setRenamingId(null);
    setRenameValue('');
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-48">
        <span className="text-gray-400 dark:text-gray-600">Loading...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="py-8 text-center text-red-600 dark:text-red-400">
        Failed to load categories. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold mb-6">Categories</h2>

      <form onSubmit={handleCreate} className="flex gap-2 mb-2">
        <input
          type="text"
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={newName.trim().length === 0}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </form>

      {createError && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">{createError}</p>
      )}

      {cats.length === 0 ? (
        <p className="mt-4 text-gray-500 dark:text-gray-400">No categories yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {cats.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
            >
              {renamingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleRename(cat.id)}
                    disabled={renameValue.trim().length === 0}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setRenamingId(null); setRenameValue(''); }}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-900 dark:text-gray-100">{cat.name}</span>
                  <button
                    onClick={() => { setRenamingId(cat.id); setRenameValue(cat.name); }}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 7.2: Run component tests**

Run inside `packages/frontend`:

```
npm test -- --reporter=verbose src/test/CategoriesPage.test.tsx
```

Expected: all 9 tests pass.

- [ ] **Step 7.3: Run full frontend suite for regressions**

```
npm test
```

Expected: all tests pass.

- [ ] **Step 7.4: Commit**

```bash
git add packages/frontend/src/pages/CategoriesPage.tsx
git commit -m "feat: implement CategoriesPage with CRUD, loading, empty, and error states"
```

---

## Task 8: App Routing + Nav Link

**Files:**
- Modify: `packages/frontend/src/App.tsx`
- Modify: `packages/frontend/src/test/App.test.tsx`

- [ ] **Step 8.1: Add the failing routing test first**

Replace the full contents of `packages/frontend/src/test/App.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App.tsx';
import * as authLib from '../lib/auth.ts';

vi.mock('../lib/categories.ts', () => ({
  listCategories: vi.fn().mockResolvedValue([]),
  createCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the app shell header', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue(null);

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText('Expense Tracker')).toBeInTheDocument();
    });
  });

  it('renders CategoriesPage at /categories when authenticated', async () => {
    vi.spyOn(authLib, 'getCurrentUser').mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: null,
      provider: 'test',
    });

    render(
      <MemoryRouter initialEntries={['/categories']}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 8.2: Run App.test.tsx to confirm new test fails**

Run inside `packages/frontend`:

```
npm test -- --reporter=verbose src/test/App.test.tsx
```

Expected: the first test passes; the new `/categories` routing test fails (route not registered yet).

- [ ] **Step 8.3: Update App.tsx with route and nav link**

Replace the full contents of `packages/frontend/src/App.tsx`:

```tsx
import { Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import NotFoundPage from './pages/NotFoundPage.tsx';
import CategoriesPage from './pages/CategoriesPage.tsx';
import ThemeToggle from './components/ThemeToggle.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function AppShell() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">Expense Tracker</h1>
          {!loading && user && (
            <nav className="flex items-center gap-4 text-sm">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/categories"
                className={({ isActive }) =>
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                }
              >
                Categories
              </NavLink>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!loading && user && (
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Sign out
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>
      <main className="px-6 py-8">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <CategoriesPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
```

- [ ] **Step 8.4: Run all frontend tests**

Run inside `packages/frontend`:

```
npm test -- --reporter=verbose
```

Expected: all tests pass, including the new routing test.

- [ ] **Step 8.5: Run all backend tests for regressions**

Run inside `packages/backend`:

```
npm test
```

Expected: all tests pass.

- [ ] **Step 8.6: Final commit**

```bash
git add packages/frontend/src/App.tsx packages/frontend/src/test/App.test.tsx
git commit -m "feat: add /categories route and nav link to app shell"
```

---

## Verification

After all tasks:

1. Start backend: `cd packages/backend && npm run dev`
2. Start frontend: `cd packages/frontend && npm run dev`
3. Sign in with a test account (or OAuth)
4. Click "Categories" in the nav — verify the page loads
5. Create a category — verify it appears in the list
6. Create the same name again — verify 409 error message appears
7. Rename a category — verify the list updates
8. Delete a category — verify it's removed
9. Open a second browser session with a different account — verify categories are isolated per user

Run full test suite from repo root (if a root-level script exists) or individually:
```
cd packages/backend && npm test
cd packages/frontend && npm test
```

All tests should pass.
