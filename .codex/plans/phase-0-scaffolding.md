# Phase 0 Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a clean tracked monorepo scaffold for the personal expense tracker so developers can install dependencies, run backend/frontend dev servers, run tests, and see structured logs from both apps.

**Architecture:** Rebuild source from a clean scaffold, using `docs/implementation-plan.md` as the product direction source of truth. Treat current ignored `dist`, `.env`, `data`, `.vite`, `logs`, and `node_modules` artifacts as disposable runtime/build leftovers, not source. Use `packages/backend` for Express + TypeScript and `packages/frontend` for React + Vite + TypeScript + Tailwind.

**Tech Stack:** npm workspaces, TypeScript, Express, Zod, Pino, Drizzle ORM, SQLite, Vitest, Supertest, React, Vite, Tailwind, React Testing Library.

---

## Summary

Implement Stage 0 only:

- Root monorepo tooling and scripts.
- Backend app foundation with health endpoint, Zod env validation, request validation helper, consistent error middleware, Pino request logging, and minimal tests.
- Frontend foundation with Vite React app shell, Tailwind theme tokens, API client shell, typed logger wrapper, loading-capable main area, and minimal tests.
- Drizzle + SQLite baseline with schema/migration scripts and test DB helper.
- README and `.env.example` files documenting local setup.

## Key Changes

- Create root workspace scripts for dev, test, build, typecheck, and lint.
- Create backend source under `packages/backend/src` with Express, logging, validation, error handling, and Drizzle SQLite setup.
- Create frontend source under `packages/frontend/src` with Vite React, Tailwind, theme foundation, API client, and logger wrapper.
- Add backend and frontend smoke tests.
- Add README and package `.env.example` files.

## Test Plan

- `npm install`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Manual smoke with `npm run dev:backend` and `npm run dev:frontend`

## Assumptions

- Use clean scaffold strategy; do not reconstruct source from ignored build artifacts.
- Use npm workspaces.
- No Docker, CI, OAuth, auth tables, categories, transactions, budgets, or WebSocket behavior in Phase 0.
- Existing ignored artifacts are left untouched.
