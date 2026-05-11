import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  listCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  DuplicateCategoryNameError,
  CategoryNotFoundError,
  CategoryHasTransactionsError,
} from '../categories/categoryService.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

const CategoryBodySchema = z.object({ name: z.string().min(1).max(100) });
const CategoryParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export function createCategoriesRouter(db: Db): Router {
  const router = Router();

  router.get('/', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    return res.json(listCategories(db, req.user.id));
  });

  router.post('/', validateRequest({ body: CategoryBodySchema }), (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    try {
      const cat = createCategory(db, req.user.id, req.body.name as string);
      return res.status(201).json(cat);
    } catch (err) {
      if (err instanceof DuplicateCategoryNameError) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  router.put('/:id', validateRequest({ params: CategoryParamsSchema, body: CategoryBodySchema }), (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    try {
      const cat = renameCategory(db, req.user.id, Number(req.params.id), req.body.name as string);
      return res.json(cat);
    } catch (err) {
      if (err instanceof CategoryNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      if (err instanceof DuplicateCategoryNameError) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  router.delete('/:id', validateRequest({ params: CategoryParamsSchema }), (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated', details: {} } });
    }
    try {
      deleteCategory(db, req.user.id, Number(req.params.id));
      return res.status(204).send();
    } catch (err) {
      if (err instanceof CategoryNotFoundError) {
        return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message, details: {} } });
      }
      if (err instanceof CategoryHasTransactionsError) {
        return res.status(409).json({ error: { code: 'CONFLICT', message: err.message, details: {} } });
      }
      next(err);
    }
  });

  return router;
}
