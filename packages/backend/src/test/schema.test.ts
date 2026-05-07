import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { users } from '../db/schema/index.js';

describe('users table', () => {
  it('can insert and retrieve a user', () => {
    const { db } = createTestDb();

    const [inserted] = db
      .insert(users)
      .values({
        provider: 'test',
        providerUserId: 'abc123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatarUrl: null,
      })
      .returning()
      .all();

    expect(inserted.id).toBeTypeOf('number');
    expect(inserted.email).toBe('test@example.com');
    expect(inserted.provider).toBe('test');
    expect(inserted.createdAt).toBeInstanceOf(Date);
  });

  it('rejects duplicate provider+providerUserId', () => {
    const { db } = createTestDb();

    const row = { provider: 'google', providerUserId: 'g1', email: 'a@b.com', displayName: 'A', avatarUrl: null };
    db.insert(users).values(row).returning().all();

    expect(() => db.insert(users).values(row).returning().all()).toThrow();
  });
});
