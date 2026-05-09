import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createBudgetAlertHub, attachBudgetAlertWebSocketServer } from "./budget-alerts/websocket.js";
import { database } from "./db/connection.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

const budgetAlertHub = createBudgetAlertHub(database);
const app = createApp({ database, budgetAlertNotifier: budgetAlertHub, env });
const server = createServer(app);

attachBudgetAlertWebSocketServer(server, database, budgetAlertHub, env);

server.listen(env.port, env.host, () => {
  logger.info({ host: env.host, port: env.port }, "backend listening");
});
