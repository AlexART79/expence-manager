import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getBudget,
  setBudget,
  getBudgetSummary,
  BudgetNotFoundError,
} from '../budgets/budgetService.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

const MonthParamsSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
});

const BudgetBodySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('USD'),
});

export function createBudgetsRouter(db: Db): Router {
  const router = Router();

  router.get(
    '/:month/summary',
    validateRequest({ params: MonthParamsSchema }),
    (req, res) => {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} },
        });
      }
      const summary = getBudgetSummary(db, req.user.id, req.params.month as string);
      return res.json(summary);
    },
  );

  router.get(
    '/:month',
    validateRequest({ params: MonthParamsSchema }),
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} },
        });
      }
      try {
        const budget = getBudget(db, req.user.id, req.params.month as string);
        return res.json(budget);
      } catch (err) {
        if (err instanceof BudgetNotFoundError) {
          return res.status(404).json({
            error: { code: 'NOT_FOUND', message: err.message, details: {} },
          });
        }
        next(err);
      }
    },
  );

  router.put(
    '/:month',
    validateRequest({ params: MonthParamsSchema, body: BudgetBodySchema }),
    (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} },
        });
      }
      try {
        const budget = setBudget(
          db,
          req.user.id,
          req.params.month as string,
          req.body.amount as number,
          req.body.currency as string,
        );
        return res.json(budget);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
