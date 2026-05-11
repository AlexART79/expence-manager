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

export const monthlyBudgets = sqliteTable(
  'monthly_budgets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id').notNull().references(() => users.id),
    month: text('month').notNull(),
    amount: real('amount').notNull(),
    currency: text('currency').notNull().default('USD'),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userMonthIdx: uniqueIndex('monthly_budgets_user_id_month_idx').on(
      table.userId,
      table.month,
    ),
  }),
);
