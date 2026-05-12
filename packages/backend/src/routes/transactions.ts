import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionNotFoundError,
  CategoryNotOwnedError,
  type TransactionFilters,
  type TransactionInput,
} from '../transactions/transactionService.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;
type NotifyAlerts = (userId: number, month: string) => void;

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const TransactionBodySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be a 3-letter code').default('USD'),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  categoryId: z.number().int().positive(),
  notes: z.string().max(1000).nullable().optional(),
});

const TransactionParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const TransactionQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountMin: z.coerce.number().positive().optional(),
  amountMax: z.coerce.number().positive().optional(),
});

const UNAUTHORIZED = { error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } };

export function createTransactionsRouter(db: Db, notifyAlerts?: NotifyAlerts): Router {
  const router = Router();

  router.get('/', validateRequest({ query: TransactionQuerySchema }), (req, res) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    const filters = req.query as TransactionFilters;
    return res.json(listTransactions(db, req.user.id, filters));
  });

  router.post('/', validateRequest({ body: TransactionBodySchema }), (req, res, next) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    try {
      const input = req.body as TransactionInput;
      const tx = createTransaction(db, req.user.id, input);
      notifyAlerts?.(req.user.id, getCurrentMonth());
      return res.status(201).json(tx);
    } catch (err) {
      if (err instanceof CategoryNotOwnedError) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  router.put('/:id', validateRequest({ params: TransactionParamsSchema, body: TransactionBodySchema }), (req, res, next) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    try {
      const input = req.body as TransactionInput;
      const tx = updateTransaction(db, req.user.id, Number(req.params.id), input);
      notifyAlerts?.(req.user.id, getCurrentMonth());
      return res.json(tx);
    } catch (err) {
      if (err instanceof TransactionNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      if (err instanceof CategoryNotOwnedError) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  router.delete('/:id', validateRequest({ params: TransactionParamsSchema }), (req, res, next) => {
    if (!req.user) return res.status(401).json(UNAUTHORIZED);
    try {
      deleteTransaction(db, req.user.id, Number(req.params.id));
      notifyAlerts?.(req.user.id, getCurrentMonth());
      return res.status(204).send();
    } catch (err) {
      if (err instanceof TransactionNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  return router;
}
