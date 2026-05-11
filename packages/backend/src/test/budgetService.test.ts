import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db.js';
import {
  setBudget,
  getBudget,
  getBudgetSummary,
  BudgetNotFoundError,
} from '../budgets/budgetService.js';
import { users, categories, transactions } from '../db/schema/index.js';

type TestDb = ReturnType<typeof createTestDb>['db'];

function insertUser(db: TestDb, email: string) {
  const [user] = db
    .insert(users)
    .values({ provider: 'test', providerUserId: email, email, displayName: email })
    .returning()
    .all();
  if (!user) throw new Error('user insert failed');
  return user;
}

function insertCategory(db: TestDb, userId: number, name: string) {
  const [cat] = db.insert(categories).values({ userId, name }).returning().all();
  if (!cat) throw new Error('category insert failed');
  return cat;
}

function insertTransaction(
  db: TestDb,
  userId: number,
  categoryId: number,
  amount: number,
  date: string,
) {
  const [tx] = db
    .insert(transactions)
    .values({ userId, categoryId, title: 'Test', amount, currency: 'USD', transactionDate: date })
    .returning()
    .all();
  if (!tx) throw new Error('transaction insert failed');
  return tx;
}

describe('budgetService', () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb().db;
  });

  it('setBudget creates a budget and getBudget retrieves it', () => {
    const user = insertUser(db, 'alice@example.com');
    const budget = setBudget(db, user.id, '2026-05', 3000, 'USD');
    expect(budget.userId).toBe(user.id);
    expect(budget.month).toBe('2026-05');
    expect(budget.amount).toBe(3000);
    expect(budget.currency).toBe('USD');

    const fetched = getBudget(db, user.id, '2026-05');
    expect(fetched.id).toBe(budget.id);
    expect(fetched.amount).toBe(3000);
  });

  it('setBudget overwrites an existing budget for the same month', () => {
    const user = insertUser(db, 'bob@example.com');
    setBudget(db, user.id, '2026-05', 1000, 'USD');
    const updated = setBudget(db, user.id, '2026-05', 2500, 'USD');
    expect(updated.amount).toBe(2500);
    const fetched = getBudget(db, user.id, '2026-05');
    expect(fetched.amount).toBe(2500);
  });

  it('setBudget allows independent budgets for different months', () => {
    const user = insertUser(db, 'carol@example.com');
    setBudget(db, user.id, '2026-04', 800, 'USD');
    setBudget(db, user.id, '2026-05', 1200, 'USD');
    expect(getBudget(db, user.id, '2026-04').amount).toBe(800);
    expect(getBudget(db, user.id, '2026-05').amount).toBe(1200);
  });

  it('getBudget throws BudgetNotFoundError when no budget exists for the month', () => {
    const user = insertUser(db, 'diana@example.com');
    expect(() => getBudget(db, user.id, '2026-05')).toThrow(BudgetNotFoundError);
  });

  it("getBudget does not return another user's budget", () => {
    const userA = insertUser(db, 'eve@example.com');
    const userB = insertUser(db, 'frank@example.com');
    setBudget(db, userA.id, '2026-05', 1000, 'USD');
    expect(() => getBudget(db, userB.id, '2026-05')).toThrow(BudgetNotFoundError);
  });

  it('getBudgetSummary sums only transactions in the given month', () => {
    const user = insertUser(db, 'grace@example.com');
    const cat = insertCategory(db, user.id, 'Food');
    insertTransaction(db, user.id, cat.id, 100, '2026-05-01');
    insertTransaction(db, user.id, cat.id, 50, '2026-05-15');
    insertTransaction(db, user.id, cat.id, 200, '2026-04-30'); // different month — must not count

    setBudget(db, user.id, '2026-05', 500, 'USD');
    const summary = getBudgetSummary(db, user.id, '2026-05');

    expect(summary.totalSpent).toBe(150);
    expect(summary.budgetAmount).toBe(500);
    expect(summary.remaining).toBe(350);
    expect(summary.usagePercent).toBeCloseTo(30);
    expect(summary.currency).toBe('USD');
  });

  it('getBudgetSummary returns null budget fields when no budget is set', () => {
    const user = insertUser(db, 'hank@example.com');
    const cat = insertCategory(db, user.id, 'Food');
    insertTransaction(db, user.id, cat.id, 75, '2026-05-10');

    const summary = getBudgetSummary(db, user.id, '2026-05');

    expect(summary.totalSpent).toBe(75);
    expect(summary.budgetAmount).toBeNull();
    expect(summary.remaining).toBeNull();
    expect(summary.usagePercent).toBeNull();
    expect(summary.currency).toBe('USD');
  });

  it('getBudgetSummary returns zero totalSpent when no transactions exist', () => {
    const user = insertUser(db, 'iris@example.com');
    setBudget(db, user.id, '2026-05', 1000, 'USD');
    const summary = getBudgetSummary(db, user.id, '2026-05');
    expect(summary.totalSpent).toBe(0);
    expect(summary.remaining).toBe(1000);
    expect(summary.usagePercent).toBe(0);
  });
});
