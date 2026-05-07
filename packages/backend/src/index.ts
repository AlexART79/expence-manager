import { createApp } from "./app.js";
import { env } from "./env.js";
import { logger } from "./logger.js";

const app = createApp();

app.listen(env.port, env.host, () => {
  logger.info({ host: env.host, port: env.port }, "backend listening");
});
