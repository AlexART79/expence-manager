# Stage 5: WebSocket Budget Alerts Implementation Plan

**Summary**
Build authenticated WebSocket budget alerts for the current calendar month. Clients subscribe with `budget_alerts.subscribe`, and the server sends visible inline budget banners when spending crosses 50%, 80%, or 100%, once per threshold per user per month.

**Key Changes**
- Add backend WebSocket support with `ws` and `@types/ws`; replace `app.listen(...)` in backend startup with an HTTP server that handles `/ws` upgrades.
- Add Drizzle schema + migration for `budget_alert_states`, keyed by `userId + month + threshold`, with `threshold` limited to `50 | 80 | 100` in service-level validation.
- Add backend budget alert modules for Zod socket messages, authenticated connection tracking, threshold calculation, and delivery persistence.
- Wire transaction create/update/delete success paths to notify the alert hub after committed DB writes.
- Add a frontend WebSocket client/hook that connects after session bootstrap, subscribes to current-month alerts, reconnects with a small backoff, validates incoming messages, logs recoverable failures, and renders inline dismissible banners near the budget dashboard.

**Interfaces**
Client to server:

```json
{
  "type": "budget_alerts.subscribe",
  "payload": {
    "month": "current"
  }
}
```

Server to client:

```json
{
  "type": "budget_alerts.alert",
  "payload": {
    "month": "2026-05",
    "threshold": 80,
    "usagePercentage": 82.5,
    "totalSpent": "825.00",
    "budgetAmount": "1000.00",
    "currency": "USD",
    "message": "You have used 80% of your May budget."
  }
}
```

**Implementation Plan**
- Backend foundation: install `ws`, authenticate `/ws` upgrades with the existing session cookie, validate subscription messages with Zod, and inject a transaction notifier.
- Alert persistence and calculation: add `budget_alert_states`, generate a migration, update test helpers, and persist newly delivered 50/80/100 thresholds for the current month.
- Transaction integration: after successful transaction create/update/delete, recalculate current-month alerts for subscribed sockets owned by that user.
- Frontend integration: connect after authenticated bootstrap, subscribe on open, validate incoming alert messages, reconnect gently, and render compact inline banners.

**Test Plan**
- Backend: cover authenticated subscribe, unauthenticated reject, invalid message close `1008`, 50/80/100 thresholds, no-budget no-op, once-per-month behavior, and user isolation.
- Frontend: cover authenticated connection, subscribe on open, alert banner rendering, dismiss behavior, and connection failure resilience.
- Verification: run targeted backend/frontend tests, full `npm test`, `npm run typecheck`, `npm run build`, and an in-memory migration smoke.

**Assumptions**
- Use inline banners for alert visibility.
- Stage 5 only covers current calendar month alerts.
- Alert persistence means “server sent the alert,” not “user dismissed/read it.”
- Docker, CI, deployment, and shared package extraction are out of scope.
