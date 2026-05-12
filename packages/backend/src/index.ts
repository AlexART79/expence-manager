import http from 'node:http';
import { createApp } from './app.js';
import { createWsServer } from './alerts/wsServer.js';
import { createSessionMiddleware } from './auth/session.js';
import { getDb } from './db/connection.js';
import { env } from './env.js';
import { logger } from './logger.js';

const db = getDb();
const sessionMiddleware = createSessionMiddleware();

// eslint-disable-next-line prefer-const
let notifyUserFn: ((userId: number, month: string) => void) | undefined;

const app = createApp(db, sessionMiddleware, (userId, month) => notifyUserFn?.(userId, month));
const server = http.createServer(app);
const wss = createWsServer(server, db, sessionMiddleware);
notifyUserFn = wss.notifyUser;

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});
