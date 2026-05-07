import { Router } from "express";
import { z } from "zod";
import type { AppEnv } from "../env.js";
import type { DatabaseHandle } from "../db/connection.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { requireAuth } from "../auth/requireAuth.js";
import { createCategory, deleteCategory, listCategories, renameCategory } from "./service.js";

const categoryNameSchema = z.string().trim().min(1, "Category name is required").max(60, "Category name is too long");

const categoryParamsSchema = z.object({
  categoryId: z.coerce.number().int().positive()
});

const categoryBodySchema = z.object({
  name: categoryNameSchema
});

export function createCategoryRouter(database: DatabaseHandle, env: AppEnv) {
  const router = Router();

  router.use("/api/categories", requireAuth(database, env));

  router.get("/api/categories", (req, res) => {
    res.json({ categories: listCategories(database.db, req.currentUser!.id) });
  });

  router.post("/api/categories", validateRequest({ body: categoryBodySchema }), (req, res) => {
    const category = createCategory(database.db, req.currentUser!.id, req.body.name);
    res.status(201).json({ category });
  });

  router.patch(
    "/api/categories/:categoryId",
    validateRequest({ params: categoryParamsSchema, body: categoryBodySchema }),
    (req, res) => {
      const categoryId = Number(req.params.categoryId);
      const category = renameCategory(database.db, req.currentUser!.id, categoryId, req.body.name);
      res.json({ category });
    }
  );

  router.delete("/api/categories/:categoryId", validateRequest({ params: categoryParamsSchema }), (req, res) => {
    const categoryId = Number(req.params.categoryId);
    deleteCategory(database.db, req.currentUser!.id, categoryId);
    res.status(204).send();
  });

  return router;
}
