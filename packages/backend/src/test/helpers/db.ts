import { sql } from "drizzle-orm";
import { createDatabase } from "../../db/connection.js";

export function createTestDatabase() {
  const database = createDatabase(":memory:");

  database.db.run(sql`
    create table users (
      id integer primary key autoincrement,
      provider text not null,
      provider_user_id text not null,
      email text,
      display_name text not null,
      avatar_url text,
      created_at integer not null,
      updated_at integer not null
    )
  `);
  database.db.run(sql`create unique index users_provider_identity_idx on users (provider, provider_user_id)`);
  database.db.run(sql`
    create table sessions (
      id integer primary key autoincrement,
      user_id integer not null references users(id) on delete cascade,
      token_hash text not null,
      expires_at integer not null,
      created_at integer not null
    )
  `);
  database.db.run(sql`create unique index sessions_token_hash_idx on sessions (token_hash)`);
  database.db.run(sql`create index sessions_user_idx on sessions (user_id)`);
  database.db.run(sql`
    create table categories (
      id integer primary key autoincrement,
      user_id integer not null references users(id) on delete cascade,
      name text not null,
      normalized_name text not null,
      created_at integer not null,
      updated_at integer not null
    )
  `);
  database.db.run(sql`create index categories_user_idx on categories (user_id)`);
  database.db.run(sql`create unique index categories_user_name_idx on categories (user_id, normalized_name)`);
  database.db.run(sql`
    create table transactions (
      id integer primary key autoincrement,
      user_id integer not null references users(id) on delete cascade,
      category_id integer not null references categories(id) on delete restrict,
      title text not null,
      amount_cents integer not null,
      transaction_date text not null,
      notes text,
      currency text not null,
      created_at integer not null,
      updated_at integer not null
    )
  `);
  database.db.run(sql`create index transactions_user_idx on transactions (user_id)`);
  database.db.run(sql`create index transactions_category_idx on transactions (category_id)`);
  database.db.run(sql`create index transactions_date_idx on transactions (transaction_date)`);
  database.db.run(sql`create index transactions_user_date_idx on transactions (user_id, transaction_date)`);
  database.db.run(sql`
    create table monthly_budgets (
      id integer primary key autoincrement,
      user_id integer not null references users(id) on delete cascade,
      month text not null,
      amount_cents integer not null,
      currency text not null,
      created_at integer not null,
      updated_at integer not null
    )
  `);
  database.db.run(sql`create index monthly_budgets_user_idx on monthly_budgets (user_id)`);
  database.db.run(sql`create unique index monthly_budgets_user_month_idx on monthly_budgets (user_id, month)`);
  database.db.run(sql`
    create table budget_alert_states (
      id integer primary key autoincrement,
      user_id integer not null references users(id) on delete cascade,
      month text not null,
      threshold integer not null,
      created_at integer not null
    )
  `);
  database.db.run(sql`create index budget_alert_states_user_month_idx on budget_alert_states (user_id, month)`);
  database.db.run(
    sql`create unique index budget_alert_states_user_month_threshold_idx on budget_alert_states (user_id, month, threshold)`
  );

  return database;
}
