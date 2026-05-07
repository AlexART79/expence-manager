import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export type ApiErrorCode = "AUTH_ERROR" | "INTERNAL_ERROR" | "NOT_FOUND" | "UNAUTHENTICATED" | "VALIDATION_ERROR";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;

  public constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, "NOT_FOUND", "Route not found", { path: req.path }));
}

export function errorHandler(err: unknown, _req: Request, res: Response<ApiErrorBody>, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten()
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    }
  });
}
