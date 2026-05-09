import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/requireAuth.js";
import type { DatabaseHandle } from "../db/connection.js";
import type { AppEnv } from "../env.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { getBudget, getBudgetSummary, upsertBudget } from "./service.js";

const monthSchema = z.string().refine(isBudgetMonth, "Month must use YYYY-MM");
const amountSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Amount must be a valid decimal")
  .refine((value) => Number(value) > 0, "Amount must be greater than 0");

const budgetParamsSchema = z.object({
  month: monthSchema
});

const budgetBodySchema = z.object({
  amount: amountSchema,
  currency: z.literal("USD")
});

export function createBudgetRouter(database: DatabaseHandle, env: AppEnv) {
  const router = Router();

  router.use("/api/budgets", requireAuth(database, env));

  router.get("/api/budgets/:month", validateRequest({ params: budgetParamsSchema }), (req, res) => {
    const month = req.params.month as string;
    res.json({ budget: getBudget(database.db, req.currentUser!.id, month) });
  });

  router.put("/api/budgets/:month", validateRequest({ params: budgetParamsSchema, body: budgetBodySchema }), (req, res) => {
    const month = req.params.month as string;
    const budget = upsertBudget(database.db, req.currentUser!.id, month, req.body);
    res.json({ budget });
  });

  router.get("/api/budgets/:month/summary", validateRequest({ params: budgetParamsSchema }), (req, res) => {
    const month = req.params.month as string;
    res.json({ summary: getBudgetSummary(database.db, req.currentUser!.id, month) });
  });

  return router;
}

function isBudgetMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}
