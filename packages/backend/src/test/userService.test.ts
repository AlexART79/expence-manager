import { describe, it, expect } from 'vitest';
import { createTestDb } from './db.js';
import { findOrCreateUser } from '../auth/userService.js';

describe('findOrCreateUser', () => {
  it('creates a new user on first call', () => {
    const { db, sqlite } = createTestDb();
    try {
      const user = findOrCreateUser(db, {
        provider: 'google',
        providerUserId: 'goog-001',
        email: 'alice@example.com',
        displayName: 'Alice',
        avatarUrl: 'https://example.com/alice.jpg',
      });

      expect(user.id).toBeTypeOf('number');
      expect(user.email).toBe('alice@example.com');
      expect(user.displayName).toBe('Alice');
      expect(user.provider).toBe('google');
      expect(user.createdAt).toBeInstanceOf(Date);
    } finally {
      sqlite.close();
    }
  });

  it('returns same user id on second call with same provider+providerUserId', () => {
    const { db, sqlite } = createTestDb();
    try {
      const params = {
        provider: 'github',
        providerUserId: 'gh-001',
        email: 'bob@example.com',
        displayName: 'Bob',
      };

      const first = findOrCreateUser(db, params);
      const second = findOrCreateUser(db, params);

      expect(second.id).toBe(first.id);
    } finally {
      sqlite.close();
    }
  });

  it('updates displayName and avatarUrl on repeat login', () => {
    const { db, sqlite } = createTestDb();
    try {
      findOrCreateUser(db, {
        provider: 'google',
        providerUserId: 'goog-002',
        email: 'carol@example.com',
        displayName: 'Carol Old',
        avatarUrl: null,
      });

      const updated = findOrCreateUser(db, {
        provider: 'google',
        providerUserId: 'goog-002',
        email: 'carol@example.com',
        displayName: 'Carol New',
        avatarUrl: 'https://example.com/carol.jpg',
      });

      expect(updated.displayName).toBe('Carol New');
      expect(updated.avatarUrl).toBe('https://example.com/carol.jpg');
    } finally {
      sqlite.close();
    }
  });
});
