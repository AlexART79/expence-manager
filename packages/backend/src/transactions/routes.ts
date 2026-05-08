import { Router } from "express";
import { z } from "zod";
import type { AppEnv } from "../env.js";
import type { DatabaseHandle } from "../db/connection.js";
import { requireAuth } from "../auth/requireAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from "./service.js";

const dateSchema = z.string().refine(isCalendarDate, "Date must use YYYY-MM-DD");
const amountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Amount must be a valid decimal")
  .refine((value) => Number(value) > 0, "Amount must be greater than 0");

const transactionParamsSchema = z.object({
  transactionId: z.coerce.number().int().positive()
});

const transactionBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  amount: amountSchema,
  transactionDate: dateSchema,
  categoryId: z.coerce.number().int().positive(),
  notes: z.string().max(500, "Notes are too long").nullable().optional(),
  currency: z.literal("USD")
});

const transactionQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  dateFrom: dateSchema.optional(),
  dateTo: dateSchema.optional(),
  amountMin: amountSchema.optional(),
  amountMax: amountSchema.optional()
});

export function createTransactionRouter(database: DatabaseHandle, env: AppEnv) {
  const router = Router();

  router.use("/api/transactions", requireAuth(database, env));

  router.get("/api/transactions", validateRequest({ query: transactionQuerySchema }), (req, res) => {
    res.json({ transactions: listTransactions(database.db, req.currentUser!.id, req.query) });
  });

  router.post("/api/transactions", validateRequest({ body: transactionBodySchema }), (req, res) => {
    const transaction = createTransaction(database.db, req.currentUser!.id, req.body);
    res.status(201).json({ transaction });
  });

  router.patch(
    "/api/transactions/:transactionId",
    validateRequest({ params: transactionParamsSchema, body: transactionBodySchema }),
    (req, res) => {
      const transactionId = Number(req.params.transactionId);
      const transaction = updateTransaction(database.db, req.currentUser!.id, transactionId, req.body);
      res.json({ transaction });
    }
  );

  router.delete("/api/transactions/:transactionId", validateRequest({ params: transactionParamsSchema }), (req, res) => {
    const transactionId = Number(req.params.transactionId);
    deleteTransaction(database.db, req.currentUser!.id, transactionId);
    res.status(204).send();
  });

  return router;
}

function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
