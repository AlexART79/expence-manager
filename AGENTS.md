# AGENTS.md

This file gives coding agents general and stack-specific engineering conventions for this repository. Keep product-specific requirements, domain rules, and implementation milestones in planning or README files instead.

## General Rules

- Read the existing project structure and conventions before making changes.
- Use the repository's monorepo package layout consistently. For this stack, prefer `packages/frontend` and `packages/backend`.
- Prefer small, focused changes that are easy to review and test.
- Keep code readable and explicit. Add abstractions only when they remove real duplication or clarify a repeated pattern.
- Preserve user work. Do not revert, delete, or rewrite unrelated changes unless explicitly asked.
- Use TypeScript types deliberately. Avoid `any` unless there is a documented boundary where the type is genuinely unknown.
- Validate data at external boundaries such as HTTP requests, form submissions, environment variables, files, and third-party responses.
- Keep secrets out of source control. Use environment variables and document required configuration in the README.
- Write tests for behavior that can break: validation, authorization, persistence, business rules, error handling, and integration boundaries.
- Prefer deterministic tests. Mock external services and time-sensitive behavior where needed.
- Keep documentation current when commands, environment variables, architecture, or important behavior changes.
- Do not add Docker, CI, deployment, or infrastructure files unless they are required by the current plan or explicitly requested.

## Code Style

- Favor clear names over comments. Add comments only when they explain why something is done, not what each line does.
- Keep modules cohesive. A file should have one primary responsibility.
- Keep public APIs stable and typed. If a helper or module is reused in multiple places, document its expected inputs and outputs through types, schemas, or clear contracts.
- Return consistent error shapes from application boundaries so callers can handle failures predictably.
- Avoid logging sensitive values such as tokens, passwords, cookies, authorization headers, full user profiles, or private free-text content.

## Stack Rules

- Backend stack: Express + TypeScript.
- Frontend stack: React + Vite + TypeScript + Tailwind.
- Persistence stack: Drizzle ORM + SQLite.
- Real-time stack: WebSockets.
- Validation stack: Zod.
- Use Zod for runtime validation at API, form, environment, and third-party boundaries.
- Infer TypeScript types from Zod schemas when that reduces duplication and keeps runtime validation aligned with compile-time types.
- Keep shared contracts in a dedicated shared package only when both frontend and backend actually consume them. Do not introduce shared packages for one-off types.

## Logging Rules

- Set up logging early in new applications, before feature work spreads across modules.
- Backend logging should use `pino`, with request logging through `pino-http` or a comparable Express middleware.
- Frontend logging should go through a small typed wrapper instead of direct scattered `console` calls. Keep the public API stable: `debug`, `info`, `warn`, `error`.
- Log structured context, not secrets. Useful examples include request ids, authenticated user ids, provider names, entity ids, and WebSocket connection ids.
- Keep logs readable in local development and machine-parseable in test or production-like environments.

## Frontend Rules

- Build accessible, responsive interfaces from the start.
- Support expected keyboard navigation, visible focus states, hover states, loading states, empty states, and error states.
- Keep visual styling consistent through shared components or documented design tokens.
- Validate forms on the client for fast feedback, while still relying on backend validation for correctness.
- Prefer Zod-backed form schemas for non-trivial forms, especially when the same shape is also validated by the backend.
- Route API calls through typed client helpers instead of scattering raw request logic across components.
- Use Tailwind utility classes consistently. Prefer reusable components for buttons, fields, dialogs, empty states, loading states, alerts, and theme-aware layout primitives.
- Keep theme behavior explicit. If an app supports multiple themes, define tokens/classes so screens work correctly in each theme.
- Keep authentication state refresh-safe when the app has browser authentication.
- Keep WebSocket connection state visible or debuggable when real-time behavior affects the user experience.

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
