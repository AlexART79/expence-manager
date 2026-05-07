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
