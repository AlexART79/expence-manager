import type { Server } from "node:http";
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket } from "ws";
import { z } from "zod";
import { getCurrentUserFromToken, readSessionToken } from "../auth/session.js";
import type { CurrentUser } from "../auth/types.js";
import type { DatabaseHandle } from "../db/connection.js";
import { createEnv, type AppEnv } from "../env.js";
import { logger } from "../logger.js";
import { collectNewBudgetAlerts, getCurrentBudgetMonth, type BudgetAlert } from "./service.js";

const budgetAlertSubscribeMessageSchema = z.object({
  type: z.literal("budget_alerts.subscribe"),
  payload: z.object({
    month: z.literal("current")
  })
});

type BudgetAlertClient = {
  socket: WebSocket;
  userId: number;
  subscribed: boolean;
};

export type BudgetAlertNotifier = {
  notifyBudgetMayHaveChanged: (userId: number) => void;
};

export type BudgetAlertHub = BudgetAlertNotifier & {
  addClient: (socket: WebSocket, user: CurrentUser) => void;
};

export function createBudgetAlertHub(database: DatabaseHandle): BudgetAlertHub {
  const clientsByUser = new Map<number, Set<BudgetAlertClient>>();

  function addClient(socket: WebSocket, user: CurrentUser) {
    const client: BudgetAlertClient = { socket, userId: user.id, subscribed: false };
    const clients = clientsByUser.get(user.id) ?? new Set<BudgetAlertClient>();
    clients.add(client);
    clientsByUser.set(user.id, clients);

    socket.on("message", (data) => {
      const parsed = parseClientMessage(data.toString());

      if (!parsed.success) {
        socket.close(1008, "Invalid budget alert subscription");
        return;
      }

      client.subscribed = true;
      sendAlerts(socket, collectAlerts(database, user.id));
    });

    socket.on("close", () => {
      clients.delete(client);
      if (clients.size === 0) {
        clientsByUser.delete(user.id);
      }
    });
  }

  function notifyBudgetMayHaveChanged(userId: number) {
    const subscribedClients = [...(clientsByUser.get(userId) ?? [])].filter(
      (client) => client.subscribed && client.socket.readyState === client.socket.OPEN
    );

    if (subscribedClients.length === 0) {
      return;
    }

    const alerts = collectAlerts(database, userId);

    for (const client of subscribedClients) {
      sendAlerts(client.socket, alerts);
    }
  }

  return { addClient, notifyBudgetMayHaveChanged };
}

export function attachBudgetAlertWebSocketServer(
  server: Server,
  database: DatabaseHandle,
  hub: BudgetAlertHub,
  env: AppEnv = createEnv(process.env)
) {
  const webSocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    if (request.url !== "/ws") {
      rejectUpgrade(socket, 404, "Not Found");
      return;
    }

    const user = authenticateRequest(request, database, env);

    if (!user) {
      rejectUpgrade(socket, 401, "Unauthorized");
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
      hub.addClient(webSocket, user);
      webSocketServer.emit("connection", webSocket, request);
    });
  });

  return webSocketServer;
}

function parseClientMessage(message: string) {
  try {
    return budgetAlertSubscribeMessageSchema.safeParse(JSON.parse(message));
  } catch (error) {
    return { success: false as const, error };
  }
}

function authenticateRequest(request: IncomingMessage, database: DatabaseHandle, env: AppEnv) {
  const token = readSessionToken(request.headers.cookie);
  return getCurrentUserFromToken(database.db, token, env);
}

function rejectUpgrade(socket: Duplex, status: number, message: string) {
  socket.write(`HTTP/1.1 ${status} ${message}\r\nConnection: close\r\n\r\n`);
  socket.destroy();
}

function collectAlerts(database: DatabaseHandle, userId: number) {
  try {
    return collectNewBudgetAlerts(database.db, userId, getCurrentBudgetMonth());
  } catch (error) {
    logger.warn({ error, userId }, "failed to collect budget alerts");
    return [];
  }
}

function sendAlerts(socket: WebSocket, alerts: BudgetAlert[]) {
  for (const alert of alerts) {
    socket.send(JSON.stringify({ type: "budget_alerts.alert", payload: alert }), (error) => {
      if (error) {
        logger.warn({ error }, "failed to send budget alert");
      }
    });
  }
}
