import express from "express";
import type { Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { createAuthRouter } from "./auth/routes.js";
import { database as defaultDatabase } from "./db/connection.js";
import type { DatabaseHandle } from "./db/connection.js";
import { createEnv } from "./env.js";
import type { AppEnv } from "./env.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { logger } from "./logger.js";
import { requestId } from "./middleware/requestId.js";
import { healthRouter } from "./routes/health.js";

type CreateAppOptions = {
  configureRoutes?: (app: Express) => void;
  database?: DatabaseHandle;
  env?: AppEnv;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = express();
  const appEnv = options.env ?? createEnv(process.env);
  const appDatabase = options.database ?? defaultDatabase;

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.id
    })
  );
  app.use(
    cors({
      credentials: true,
      origin: appEnv.corsOrigin
    })
  );
  app.use(express.json());
  app.use(healthRouter);
  app.use(createAuthRouter(appDatabase, appEnv));
  options.configureRoutes?.(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
