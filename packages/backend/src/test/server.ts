import { createApp } from '../app.js';
import { createTestDb } from './db.js';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

export interface TestServer {
  url: string;
  close: () => Promise<void>;
}

export function startTestServer(): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    const { db, sqlite } = createTestDb();
    const app = createApp(db);
    const server: Server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://localhost:${port}`,
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
