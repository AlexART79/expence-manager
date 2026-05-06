import express, { type Application } from 'express';
import { pinoHttp } from 'pino-http';
import { logger } from './logger.js';
import { healthRouter } from './routes/health.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Application {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.use('/health', healthRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Route not found', details: {} },
    });
  });

  app.use(errorHandler);

  return app;
}
