import { describe, expect, it, vi } from "vitest";
import { createBudgetAlertClient } from "./budgetAlertClient";

class FakeWebSocket {
  static OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  static instances: FakeWebSocket[] = [];

  send(message: string) {
    this.sent.push(message);
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe("budget alert client", () => {
  it("connects to /ws, subscribes on open, validates alert messages, and closes on unsubscribe", () => {
    FakeWebSocket.instances = [];
    const warn = vi.fn();
    const alerts: unknown[] = [];
    const client = createBudgetAlertClient({
      WebSocketCtor: FakeWebSocket,
      logger: { warn },
      origin: "http://localhost:3000"
    });

    const unsubscribe = client.subscribe((alert) => alerts.push(alert));
    const socket = FakeWebSocket.instances[0]!;

    expect(socket.url).toBe("ws://localhost:3000/ws");

    socket.open();
    expect(socket.sent).toEqual([JSON.stringify({ type: "budget_alerts.subscribe", payload: { month: "current" } })]);

    socket.message({
      type: "budget_alerts.alert",
      payload: {
        month: "2026-05",
        threshold: 80,
        usagePercentage: 82.5,
        totalSpent: "825.00",
        budgetAmount: "1000.00",
        currency: "USD",
        message: "You have used 80% of your May budget."
      }
    });
    socket.message({ type: "budget_alerts.alert", payload: { threshold: "bad" } });

    expect(alerts).toEqual([
      {
        month: "2026-05",
        threshold: 80,
        usagePercentage: 82.5,
        totalSpent: "825.00",
        budgetAmount: "1000.00",
        currency: "USD",
        message: "You have used 80% of your May budget."
      }
    ]);
    expect(warn).toHaveBeenCalledWith("Invalid budget alert message", expect.any(Object));

    unsubscribe();
    expect(socket.readyState).toBe(3);
  });
});
