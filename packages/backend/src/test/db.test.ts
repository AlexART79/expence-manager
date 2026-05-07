import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDatabase } from "../db/connection.js";
import { users } from "../db/schema/index.js";
import { createTestDatabase } from "./helpers/db.js";

describe("database foundation", () => {
  it("creates an in-memory Drizzle SQLite database for tests", () => {
    const { db, sqlite } = createTestDatabase();

    db.run(sql`select 1`);
    db.insert(users)
      .values({
        provider: "google",
        providerUserId: "ready",
        email: null,
        displayName: "Ready",
        avatarUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
      .run();

    const row = db.select().from(users).get();
    expect(row?.displayName).toBe("Ready");

    sqlite.close();
  });

  it("opens a database from an explicit file path", () => {
    const { sqlite } = createDatabase(":memory:");

    expect(sqlite.open).toBe(true);
    sqlite.close();
  });
});
