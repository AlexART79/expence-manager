import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env['DATABASE_URL'] ?? './data/app.db';

fs.mkdirSync(path.dirname(path.resolve(dbUrl)), { recursive: true });

const sqlite = new Database(dbUrl);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(__dirname, 'migrations') });
console.log('Migrations applied successfully');
sqlite.close();
