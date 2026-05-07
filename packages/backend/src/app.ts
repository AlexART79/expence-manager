import express from "express";
import type { Express } from "express";
import { pinoHttp } from "pino-http";
import { errorHandler, notFoundHandler } from "./errors.js";
import { logger } from "./logger.js";
import { requestId } from "./middleware/requestId.js";
import { healthRouter } from "./routes/health.js";

type CreateAppOptions = {
  configureRoutes?: (app: Express) => void;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id
    })
  );
  app.use(express.json());
  app.use(healthRouter);
  options.configureRoutes?.(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
