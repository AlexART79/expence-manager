import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'node:http';
import type { RequestHandler } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { logger } from '../logger.js';
import { checkAndDispatchAlerts } from './alertService.js';
import type { getDb } from '../db/connection.js';

type Db = ReturnType<typeof getDb>;

const SubscribeMessageSchema = z.object({
  type: z.literal('budget_alerts.subscribe'),
  payload: z.object({ month: z.literal('current') }),
});

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const socketMeta = new WeakMap<WebSocket, { userId: number; month: string }>();
const userSockets = new Map<number, Set<WebSocket>>();

function addSubscription(ws: WebSocket, userId: number, month: string) {
  socketMeta.set(ws, { userId, month });
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(ws);
}

function removeSubscription(ws: WebSocket) {
  const meta = socketMeta.get(ws);
  if (!meta) return;
  const set = userSockets.get(meta.userId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) userSockets.delete(meta.userId);
  }
  socketMeta.delete(ws);
}

export function createWsServer(server: Server, db: Db, sessionMiddleware: RequestHandler) {
  const wss = new WebSocketServer({ server });
  const passportInit = passport.initialize();
  const passportSession = passport.session();
  const fakeRes = {
    getHeader: () => undefined as unknown,
    setHeader: () => undefined,
    end: () => undefined,
  } as unknown as Parameters<RequestHandler>[1];

  wss.on('connection', (ws, req) => {
    const expressReq = req as Parameters<RequestHandler>[0];
    sessionMiddleware(expressReq, fakeRes, () => {
      passportInit(expressReq, fakeRes, () => {
        passportSession(expressReq, fakeRes, () => {
          const user = (req as { user?: { id: number } }).user;

          if (!user) {
            logger.warn('WS connection rejected: not authenticated');
            ws.close(1008, 'Not authenticated');
            return;
          }

          logger.info({ userId: user.id }, 'WS connection established');

          ws.on('message', (data) => {
            try {
              const parsed = SubscribeMessageSchema.safeParse(JSON.parse(data.toString()));
              if (!parsed.success) return;

              const month = getCurrentMonth();
              addSubscription(ws, user.id, month);

              ws.send(
                JSON.stringify({
                  type: 'budget_alerts.subscribed',
                  payload: { month },
                }),
              );

              logger.info({ userId: user.id, month }, 'WS subscription registered');
            } catch {
              // ignore malformed messages
            }
          });

          ws.on('close', () => {
            removeSubscription(ws);
            logger.info({ userId: user.id }, 'WS connection closed');
          });

          ws.on('error', (err) => {
            logger.warn({ err, userId: user.id }, 'WS connection error');
          });
        });
      });
    });
  });

  function notifyUser(userId: number, month: string) {
    const sockets = userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;

    checkAndDispatchAlerts(db, userId, month, (threshold, usagePercent) => {
      const msg = JSON.stringify({
        type: 'budget_alerts.alert',
        payload: { month, threshold, usagePercent },
      });
      for (const ws of sockets) {
        const meta = socketMeta.get(ws);
        if (meta?.month === month && ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      }
    });
  }

  return { notifyUser };
}
