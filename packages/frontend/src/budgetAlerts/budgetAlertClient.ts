import { z } from "zod";
import { API_BASE_URL } from "../lib/apiClient";
import { logger as defaultLogger } from "../lib/logger";

const budgetAlertMessageSchema = z.object({
  type: z.literal("budget_alerts.alert"),
  payload: z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    threshold: z.union([z.literal(50), z.literal(80), z.literal(100)]),
    usagePercentage: z.number(),
    totalSpent: z.string(),
    budgetAmount: z.string(),
    currency: z.literal("USD"),
    message: z.string().min(1)
  })
});

export type BudgetAlert = z.infer<typeof budgetAlertMessageSchema>["payload"];

type BudgetAlertClientLogger = {
  warn: (message: string, context?: Record<string, unknown>) => void;
};

type WebSocketLike = {
  readyState: number;
  onopen: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onerror: ((event?: unknown) => void) | null;
  onclose: ((event?: unknown) => void) | null;
  send: (message: string) => void;
  close: () => void;
};

type WebSocketCtor = {
  new (url: string): WebSocketLike;
  OPEN: number;
};

export type BudgetAlertClient = {
  subscribe: (onAlert: (alert: BudgetAlert) => void) => () => void;
};

type CreateBudgetAlertClientOptions = {
  WebSocketCtor?: WebSocketCtor;
  logger?: BudgetAlertClientLogger;
  origin?: string;
  reconnectDelayMs?: number;
};

const SUBSCRIBE_MESSAGE = JSON.stringify({ type: "budget_alerts.subscribe", payload: { month: "current" } });

export function createBudgetAlertClient(options: CreateBudgetAlertClientOptions = {}): BudgetAlertClient {
  const WebSocketCtor = options.WebSocketCtor ?? (window.WebSocket as unknown as WebSocketCtor);
  const clientLogger = options.logger ?? defaultLogger;
  const origin = options.origin ?? API_BASE_URL;
  const reconnectDelayMs = options.reconnectDelayMs ?? 1500;

  return {
    subscribe(onAlert) {
      let isActive = true;
      let reconnectTimer: ReturnType<typeof window.setTimeout> | null = null;
      let socket: WebSocketLike | null = null;

      function connect() {
        const nextSocket = new WebSocketCtor(toWebSocketUrl(origin));
        socket = nextSocket;

        nextSocket.onopen = () => {
          nextSocket.send(SUBSCRIBE_MESSAGE);
        };

        nextSocket.onmessage = (event) => {
          handleMessage(event.data, onAlert, clientLogger);
        };

        nextSocket.onerror = () => {
          clientLogger.warn("Budget alert socket error");
        };

        nextSocket.onclose = () => {
          if (!isActive) {
            return;
          }

          reconnectTimer = window.setTimeout(connect, reconnectDelayMs);
        };
      }

      connect();

      return () => {
        isActive = false;

        if (reconnectTimer) {
          window.clearTimeout(reconnectTimer);
        }

        socket?.close();
      };
    }
  };
}

export const budgetAlertClient = createBudgetAlertClient();

function handleMessage(message: string, onAlert: (alert: BudgetAlert) => void, clientLogger: BudgetAlertClientLogger) {
  try {
    const parsed = budgetAlertMessageSchema.safeParse(JSON.parse(message));

    if (!parsed.success) {
      clientLogger.warn("Invalid budget alert message", { issues: parsed.error.issues });
      return;
    }

    onAlert(parsed.data.payload);
  } catch (error) {
    clientLogger.warn("Invalid budget alert message", { error });
  }
}

function toWebSocketUrl(origin: string) {
  const url = new URL(origin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  url.hash = "";
  return url.toString();
}
