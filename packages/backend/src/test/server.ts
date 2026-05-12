import http from 'node:http';
import { createApp } from '../app.js';
import { createWsServer } from '../alerts/wsServer.js';
import { createSessionMiddleware } from '../auth/session.js';
import { createTestDb } from './db.js';
import type { AddressInfo } from 'node:net';

export interface TestServer {
  url: string;
  wsUrl: string;
  close: () => Promise<void>;
}

export function startTestServer(): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    const { db, sqlite } = createTestDb();
    const sessionMiddleware = createSessionMiddleware();

    // eslint-disable-next-line prefer-const
    let notifyUserFn: ((userId: number, month: string) => void) | undefined;

    const app = createApp(db, sessionMiddleware, (userId, month) => notifyUserFn?.(userId, month));
    const server = http.createServer(app);
    const wss = createWsServer(server, db, sessionMiddleware);
    notifyUserFn = wss.notifyUser;

    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://localhost:${port}`,
        wsUrl: `ws://localhost:${port}`,
        close: () =>
          new Promise<void>((res, rej) =>
            server.close((err) => {
              sqlite.close();
              err ? rej(err) : res();
            }),
          ),
      });
    });
    server.on('error', reject);
  });
}
