# Phase 1 Authentication And User Identity Implementation Plan

**Target file:** `.codex/plans/phase-1-authentication-and-user-identity.md`

## Summary

Implement Stage 1 from `docs/implementation-plan.md`: SSO-only auth with Google and GitHub, local user creation, persistent HTTP-only cookie sessions, `/api/auth/me` bootstrap, logout, frontend auth entry UI, and deterministic tests with mocked providers. Use no account linking: Google and GitHub identities create separate local users.

## Key Changes

- Add backend auth dependencies and config:
  - Add `cors` and `cookie` to `packages/backend`.
  - Extend env validation and `.env.example` with `SESSION_SECRET`, frontend redirect URL, Google OAuth vars, GitHub OAuth vars, and `AUTH_TEST_MODE`.
  - Enable CORS credentials in `createApp()` for `CORS_ORIGIN`.

- Add auth database schema:
  - Replace the Phase 0 placeholder schema with `users` and `sessions`.
  - `users`: `id`, `provider`, `providerUserId`, `email`, `displayName`, `avatarUrl`, timestamps.
  - Unique index on `provider + providerUserId`.
  - `sessions`: `id`, `userId`, hashed token, expiry, timestamps.
  - Session cookie stores only the opaque token, never user data.

- Add backend auth modules:
  - `auth/session`: create, hash, read, validate, expire sessions.
  - `auth/providers`: Google OIDC and GitHub OAuth adapters that exchange callback codes and normalize profiles.
  - `auth/testProvider`: enabled only when `AUTH_TEST_MODE=true`, returning deterministic provider users without network calls.
  - `auth/routes`: `GET /api/auth/:provider/start`, `GET /api/auth/:provider/callback`, `GET /api/auth/me`, `POST /api/auth/logout`.
  - `auth/requireAuth`: middleware that resolves `currentUser` for later phases.
  - Return existing API error shape for unauthenticated, invalid provider, validation, and callback failures.

- Add frontend auth flow:
  - Extend `ApiClient` with `post`.
  - Add typed auth client helpers for `getCurrentUser`, `logout`, and provider login URL construction.
  - Update `App` to bootstrap `/api/auth/me` on load, show auth entry when unauthenticated, show authenticated shell when signed in, and support logout.
  - Keep the Phase 0 theme toggle and loading-capable main area.

- Update docs:
  - README documents OAuth env vars, test-mode auth, auth endpoints, cookie behavior, and local login flow.
  - `.env.example` files stay safe and contain no real secrets.

## Test Plan

- Backend tests:
  - User upsert creates a user for first SSO login and reuses the same user for the same `provider + providerUserId`.
  - Test-mode Google and GitHub callback creates a local user and sets an HTTP-only session cookie.
  - `GET /api/auth/me` returns `401` without a session and current user with a valid session.
  - `POST /api/auth/logout` expires the session and clears the cookie.
  - Invalid provider and failed callback paths return the shared API error shape.

- Frontend tests:
  - Initial app load shows loading state while session bootstraps.
  - Unauthenticated state renders “Continue with Google” and “Continue with GitHub”.
  - Authenticated state renders current user identity and logout control.
  - Logout calls the API and returns the UI to the auth entry state.

- Verification commands:
  - `npm run typecheck`
  - `npm test`
  - `npm run build`

## Assumptions

- Use `sameSite=lax`, `httpOnly=true`, `secure=true` only in production; local development uses non-secure cookies for `http://localhost`.
- Session duration is 7 days.
- OAuth callback redirects to the frontend root after success.
- No account linking in Phase 1.
- Tests must not call Google or GitHub; test-mode provider stubs cover success paths.
