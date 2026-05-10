# Backend AGENTS.md

Stack-specific conventions for backend development. See the root `AGENTS.md` for general conventions and shared stack rules.

## Backend Stack

- Stack: Express + TypeScript
- Persistence: Drizzle ORM + SQLite
- Real-time: WebSockets
- Validation: Zod

## Backend Logging

- Set up logging early in new applications, before feature work spreads across modules.
- Use `pino`, with request logging through `pino-http` or a comparable Express middleware.
- Log structured context, not secrets. Useful examples include request ids, authenticated user ids, provider names, entity ids, and WebSocket connection ids.
- Keep logs readable in local development and machine-parseable in test or production-like environments.

## Backend Rules

- Keep route/controller handlers thin. Put business rules, persistence logic, and integration logic into testable modules.
- Enforce authorization close to every data operation, not only at the UI or route level.
- Validate request bodies, params, query strings, headers, and environment configuration before use.
- Use Zod schemas for request bodies, route params, query strings, WebSocket messages, third-party payloads, and environment variables.
- Use structured logging with useful context such as request ids and entity ids, without leaking secrets.
- Make WebSocket handlers, background jobs, and event handlers follow the same auth, validation, logging, and error-handling standards as HTTP routes.
- Keep database migrations intentional and reviewable. Do not edit generated migration history casually after it has been shared.
- Keep Drizzle schema definitions, migrations, database connection setup, and test database helpers in clear database-focused modules.
- Use SQLite for local development and tests unless the project documentation explicitly says otherwise.
