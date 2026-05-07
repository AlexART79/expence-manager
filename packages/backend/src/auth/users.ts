import { and, eq } from "drizzle-orm";
import type { DatabaseHandle } from "../db/connection.js";
import { users } from "../db/schema/index.js";
import type { CurrentUser, ProviderUser } from "./types.js";

type Db = DatabaseHandle["db"];

export function toCurrentUser(user: typeof users.$inferSelect): CurrentUser {
  return {
    id: user.id,
    provider: user.provider,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl
  };
}

export function upsertUserFromProvider(db: Db, providerUser: ProviderUser): CurrentUser {
  const now = Date.now();
  const existing = db
    .select()
    .from(users)
    .where(and(eq(users.provider, providerUser.provider), eq(users.providerUserId, providerUser.providerUserId)))
    .get();

  if (existing) {
    const updated = db
      .update(users)
      .set({
        email: providerUser.email,
        displayName: providerUser.displayName,
        avatarUrl: providerUser.avatarUrl,
        updatedAt: now
      })
      .where(eq(users.id, existing.id))
      .returning()
      .get();

    return toCurrentUser(updated);
  }

  const created = db
    .insert(users)
    .values({
      provider: providerUser.provider,
      providerUserId: providerUser.providerUserId,
      email: providerUser.email,
      displayName: providerUser.displayName,
      avatarUrl: providerUser.avatarUrl,
      createdAt: now,
      updatedAt: now
    })
    .returning()
    .get();

  return toCurrentUser(created);
}
