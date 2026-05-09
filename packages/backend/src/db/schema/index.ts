import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    provider: text("provider", { enum: ["google", "github"] }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    email: text("email"),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull()
  },
  (table) => ({
    providerIdentityIdx: uniqueIndex("users_provider_identity_idx").on(table.provider, table.providerUserId)
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
    userIdx: index("sessions_user_idx").on(table.userId)
  })
);

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull()
  },
  (table) => ({
    userIdx: index("categories_user_idx").on(table.userId),
    userNameIdx: uniqueIndex("categories_user_name_idx").on(table.userId, table.normalizedName)
  })
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    amountCents: integer("amount_cents").notNull(),
    transactionDate: text("transaction_date").notNull(),
    notes: text("notes"),
    currency: text("currency", { enum: ["USD"] }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull()
  },
  (table) => ({
    userIdx: index("transactions_user_idx").on(table.userId),
    categoryIdx: index("transactions_category_idx").on(table.categoryId),
    dateIdx: index("transactions_date_idx").on(table.transactionDate),
    userDateIdx: index("transactions_user_date_idx").on(table.userId, table.transactionDate)
  })
);

export const monthlyBudgets = sqliteTable(
  "monthly_budgets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency", { enum: ["USD"] }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull()
  },
  (table) => ({
    userIdx: index("monthly_budgets_user_idx").on(table.userId),
    userMonthIdx: uniqueIndex("monthly_budgets_user_month_idx").on(table.userId, table.month)
  })
);

export const budgetAlertStates = sqliteTable(
  "budget_alert_states",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(),
    threshold: integer("threshold").notNull(),
    createdAt: integer("created_at").notNull()
  },
  (table) => ({
    userMonthIdx: index("budget_alert_states_user_month_idx").on(table.userId, table.month),
    userMonthThresholdIdx: uniqueIndex("budget_alert_states_user_month_threshold_idx").on(
      table.userId,
      table.month,
      table.threshold
    )
  })
);
