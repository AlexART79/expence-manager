import type { getDb } from '../db/connection.js';
import { users } from '../db/schema/index.js';
import type { User } from './types.js';

type Db = ReturnType<typeof getDb>;

export interface UpsertUserParams {
  provider: string;
  providerUserId: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

export function findOrCreateUser(db: Db, params: UpsertUserParams): User {
  const [user] = db
    .insert(users)
    .values({
      provider: params.provider,
      providerUserId: params.providerUserId,
      email: params.email,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl ?? null,
    })
    .onConflictDoUpdate({
      target: [users.provider, users.providerUserId],
      set: {
        displayName: params.displayName,
        avatarUrl: params.avatarUrl ?? null,
        updatedAt: new Date(),
      },
    })
    .returning()
    .all();

  if (!user) throw new Error('Failed to upsert user');
  return user;
}
