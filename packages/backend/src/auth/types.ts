import type { InferSelectModel } from 'drizzle-orm';
import type { users } from '../db/schema/index.js';

export type User = InferSelectModel<typeof users>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: number;
      provider: string;
      providerUserId: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
  }
}
