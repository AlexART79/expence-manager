import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { env } from "../env.js";
import * as schema from "./schema/index.js";

export function createDatabase(databaseFile = env.databaseFile) {
  if (databaseFile !== ":memory:") {
    mkdirSync(dirname(databaseFile), { recursive: true });
  }

  const sqlite = new Database(databaseFile);
  const db = drizzle(sqlite, { schema });

  return { db, sqlite };
}

export type DatabaseHandle = ReturnType<typeof createDatabase>;

export const database = createDatabase();
