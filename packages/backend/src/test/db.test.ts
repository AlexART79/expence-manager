import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDatabase } from "../db/connection.js";
import { phase0Metadata } from "../db/schema/index.js";
import { createTestDatabase } from "./helpers/db.js";

describe("database foundation", () => {
  it("creates an in-memory Drizzle SQLite database for tests", () => {
    const { db, sqlite } = createTestDatabase();

    db.run(
      sql`create table if not exists phase0_metadata (id integer primary key, label text not null)`
    );
    db.insert(phase0Metadata).values({ label: "ready" }).run();

    const row = db.select().from(phase0Metadata).get();
    expect(row?.label).toBe("ready");

    sqlite.close();
  });

  it("opens a database from an explicit file path", () => {
    const { sqlite } = createDatabase(":memory:");

    expect(sqlite.open).toBe(true);
    sqlite.close();
  });
});
