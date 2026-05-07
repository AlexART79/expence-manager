import { describe, expect, it } from "vitest";
import { createTestDatabase } from "../test/helpers/db.js";
import { upsertUserFromProvider } from "./users.js";

describe("auth user identity", () => {
  it("creates then reuses a user by provider identity", () => {
    const database = createTestDatabase();

    const first = upsertUserFromProvider(database.db, {
      provider: "google",
      providerUserId: "google-user-1",
      email: "alex@example.com",
      displayName: "Alex",
      avatarUrl: "https://example.com/alex.png"
    });
    const second = upsertUserFromProvider(database.db, {
      provider: "google",
      providerUserId: "google-user-1",
      email: "alex.updated@example.com",
      displayName: "Alex Updated",
      avatarUrl: null
    });

    expect(second.id).toBe(first.id);
    expect(second.email).toBe("alex.updated@example.com");
    expect(second.displayName).toBe("Alex Updated");

    database.sqlite.close();
  });
});
