import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../errors.js";

type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

export function validateRequest(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const details: Record<string, unknown> = {};

    for (const [key, schema] of Object.entries(schemas)) {
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(req[key as keyof Pick<Request, "body" | "query" | "params">]);
      if (!result.success) {
        details[key] = result.error.flatten();
        continue;
      }

      Object.defineProperty(req, key, {
        value: result.data,
        configurable: true,
        enumerable: true,
        writable: true
      });
    }

    if (Object.keys(details).length > 0) {
      next(new ApiError(400, "VALIDATION_ERROR", "Request validation failed", details));
      return;
    }

    next();
  };
}
