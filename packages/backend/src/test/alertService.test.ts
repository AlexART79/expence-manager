import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db.js';
import { checkAndDispatchAlerts } from '../alerts/alertService.js';
import { users, categories, transactions, monthlyBudgets } from '../db/schema/index.js';

function setup() {
  const { db, sqlite } = createTestDb();

  const [user] = db.insert(users).values({
    provider: 'test',
    providerUserId: 'u1',
    email: 'test@ex.com',
    displayName: 'Tester',
  }).returning().all();
  if (!user) throw new Error('user insert failed');

  const [cat] = db.insert(categories).values({ userId: user.id, name: 'Food' }).returning().all();
  if (!cat) throw new Error('category insert failed');

  return { db, sqlite, userId: user.id, categoryId: cat.id };
}

function addTransaction(db: ReturnType<typeof createTestDb>['db'], userId: number, categoryId: number, amount: number, month: string) {
  db.insert(transactions).values({
    userId,
    categoryId,
    title: 'Test',
    amount,
    currency: 'USD',
    transactionDate: `${month}-01`,
  }).run();
}

function setBudget(db: ReturnType<typeof createTestDb>['db'], userId: number, month: string, amount: number) {
  db.insert(monthlyBudgets).values({ userId, month, amount, currency: 'USD' }).run();
}

describe('checkAndDispatchAlerts', () => {
  it('does not dispatch when no budget is set', () => {
    const { db, userId, categoryId } = setup();
    addTransaction(db, userId, categoryId, 600, '2026-05');

    const dispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => dispatched.push(threshold));

    expect(dispatched).toEqual([]);
  });

  it('does not dispatch when usage is below all thresholds', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 400, '2026-05'); // 40%

    const dispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => dispatched.push(threshold));

    expect(dispatched).toEqual([]);
  });

  it('dispatches the 50% threshold when usage is exactly 50%', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 500, '2026-05'); // 50%

    const dispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => dispatched.push(threshold));

    expect(dispatched).toEqual([50]);
  });

  it('dispatches 50% and 80% thresholds when usage is at 85%', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 850, '2026-05'); // 85%

    const dispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => dispatched.push(threshold));

    expect(dispatched).toEqual([50, 80]);
  });

  it('dispatches 50%, 80%, and 100% when usage reaches 100%', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 1000, '2026-05'); // 100%

    const dispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => dispatched.push(threshold));

    expect(dispatched).toEqual([50, 80, 100]);
  });

  it('dispatches 100% but not 50% or 80% when those are already alerted', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 850, '2026-05');

    // First call marks 50 and 80
    checkAndDispatchAlerts(db, userId, '2026-05', () => {});

    // Add more to hit 100%
    addTransaction(db, userId, categoryId, 200, '2026-05');

    const dispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => dispatched.push(threshold));

    expect(dispatched).toEqual([100]);
  });

  it('does not dispatch any threshold twice', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 600, '2026-05'); // 60%

    const firstDispatch: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => firstDispatch.push(threshold));
    expect(firstDispatch).toEqual([50]);

    const secondDispatch: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold) => secondDispatch.push(threshold));
    expect(secondDispatch).toEqual([]); // 50 already alerted, 60% < 80%
  });

  it('passes usagePercent to the dispatch callback', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    addTransaction(db, userId, categoryId, 750, '2026-05'); // 75%

    const calls: Array<{ threshold: number; usagePercent: number }> = [];
    checkAndDispatchAlerts(db, userId, '2026-05', (threshold, usagePercent) =>
      calls.push({ threshold, usagePercent }),
    );

    expect(calls).toEqual([{ threshold: 50, usagePercent: 75 }]);
  });

  it('alerts are independent per month', () => {
    const { db, userId, categoryId } = setup();
    setBudget(db, userId, '2026-05', 1000);
    setBudget(db, userId, '2026-06', 1000);
    addTransaction(db, userId, categoryId, 600, '2026-05');

    // Alert 50% for May
    checkAndDispatchAlerts(db, userId, '2026-05', () => {});

    // June has no transactions — no alerts
    const juneDispatched: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-06', (threshold) => juneDispatched.push(threshold));
    expect(juneDispatched).toEqual([]);

    // Add June transaction at 60%
    addTransaction(db, userId, categoryId, 600, '2026-06');
    const juneDispatched2: number[] = [];
    checkAndDispatchAlerts(db, userId, '2026-06', (threshold) => juneDispatched2.push(threshold));
    expect(juneDispatched2).toEqual([50]); // June's 50% not yet alerted
  });
});
