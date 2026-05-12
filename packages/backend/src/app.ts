import express, { type Application, type RequestHandler } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import passport from 'passport';
import { logger } from './logger.js';
import { healthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { createCategoriesRouter } from './routes/categories.js';
import { createTransactionsRouter } from './routes/transactions.js';
import { createBudgetsRouter } from './routes/budgets.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSessionMiddleware } from './auth/session.js';
import { registerStrategies } from './auth/strategies.js';
import { getDb } from './db/connection.js';
import { env } from './env.js';

type NotifyAlerts = (userId: number, month: string) => void;

export function createApp(
  db = getDb(),
  sessionMiddleware: RequestHandler = createSessionMiddleware(),
  notifyAlerts?: NotifyAlerts,
): Application {
  const app = express();

  registerStrategies(db);

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/health', healthRouter);
  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/categories', createCategoriesRouter(db));
  app.use('/api/transactions', createTransactionsRouter(db, notifyAlerts));
  app.use('/api/budgets', createBudgetsRouter(db));

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found', details: {} },
    });
  });

  app.use(errorHandler);

  return app;
}
