import express, { type Application } from 'express';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import passport from 'passport';
import { logger } from './logger.js';
import { healthRouter } from './routes/health.js';
import { createAuthRouter } from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSessionMiddleware } from './auth/session.js';
import { registerStrategies } from './auth/strategies.js';
import { getDb } from './db/connection.js';
import { env } from './env.js';

export function createApp(db = getDb()): Application {
  const app = express();

  registerStrategies(db);

  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));
  app.use(createSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/health', healthRouter);
  app.use('/api/auth', createAuthRouter(db));

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found', details: {} },
    });
  });

  app.use(errorHandler);

  return app;
}
