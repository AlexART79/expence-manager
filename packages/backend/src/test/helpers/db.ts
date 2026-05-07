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

  return database;
}
