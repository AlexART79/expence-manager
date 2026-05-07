import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { createDatabase } from "./connection.js";
import { env } from "../env.js";

mkdirSync(dirname(env.databaseFile), { recursive: true });

const { db, sqlite } = createDatabase(env.databaseFile);

migrate(db, { migrationsFolder: "drizzle" });
sqlite.close();
