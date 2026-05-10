# Frontend AGENTS.md

Stack-specific conventions for frontend development. See the root `AGENTS.md` for general conventions and shared stack rules.

## Frontend Stack

- Stack: React + Vite + TypeScript + Tailwind
- Validation: Zod
- Use Zod-backed form schemas for non-trivial forms, especially when the same shape is also validated by the backend.

## Frontend Logging

- Use a small typed wrapper instead of direct scattered `console` calls. Keep the public API stable: `debug`, `info`, `warn`, `error`.
- Log structured context, not secrets. Useful examples include request ids, authenticated user ids, provider names, entity ids, and WebSocket connection ids.
- Keep logs readable in local development and machine-parseable in test or production-like environments.

## Frontend Rules

- Build accessible, responsive interfaces from the start.
- Use **frontend-design** skill to to create polished code with bold aesthetic choices, distinctive typography and color palettes, high-impact animations, and context-aware visual details.
- Support expected keyboard navigation, visible focus states, hover states, loading states, empty states, and error states.
- Keep visual styling consistent through shared components or documented design tokens.
- Validate forms on the client for fast feedback, while still relying on backend validation for correctness.
- Route API calls through typed client helpers instead of scattering raw request logic across components.
- Use Tailwind utility classes consistently. Prefer reusable components for buttons, fields, dialogs, empty states, loading states, alerts, and theme-aware layout primitives.
- Keep theme behavior explicit. If an app supports multiple themes, define tokens/classes so screens work correctly in each theme.
- Keep authentication state refresh-safe when the app has browser authentication.
- Keep WebSocket connection state visible or debuggable when real-time behavior affects the user experience.
