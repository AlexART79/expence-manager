# AGENTS.md

This file gives coding agents general engineering conventions and project structure for this repository. Keep product-specific requirements, domain rules, and implementation milestones in planning or README files instead.

See `packages/frontend/AGENTS.md` and `packages/backend/AGENTS.md` for stack-specific rules.

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
- Prefer **PowerShell** native commands instead of plain cmd or bash/zsh

## Code Style

- Favor clear names over comments. Add comments only when they explain why something is done, not what each line does.
- Keep modules cohesive. A file should have one primary responsibility.
- Keep public APIs stable and typed. If a helper or module is reused in multiple places, document its expected inputs and outputs through types, schemas, or clear contracts.
- Return consistent error shapes from application boundaries so callers can handle failures predictably.
- Avoid logging sensitive values such as tokens, passwords, cookies, authorization headers, full user profiles, or private free-text content.

## Deletion & Destructive Actions

**Rule:** All destructive actions (delete, clear, reset) MUST require explicit user confirmation before proceeding. Never implement a delete button that acts immediately.

**Implementation:** Use the `ConfirmButton` component from `packages/frontend/src/components/ConfirmButton.tsx`.

**Example:**
```tsx
import ConfirmButton from '../components/ConfirmButton';

<ConfirmButton
  icon={Trash2}
  iconLabel="Delete"
  onConfirm={async () => {
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  }}
  confirmMessage="Delete this item?"
/>
```

**When to use:** Any action that removes data:
- Delete categories, transactions, budgets, accounts
- Clear all data
- Archive records
- Reset settings

**Component API:**
- `icon`: Lucide React icon component
- `iconLabel`: Aria label for accessibility
- `onConfirm`: Async function executed on confirmation
- `confirmMessage`: Optional message shown in confirmation state (default: "Are you sure?")
- `confirmText`: Optional button text (default: "Confirm")
- `isDangerous`: If true, uses red styling (default: false)

**Error handling:** If `onConfirm()` throws, the error displays below the buttons. Buttons remain enabled for retry.

## Stack Rules (Shared)

- Validation stack: Zod.
- Use Zod for runtime validation at API, form, environment, and third-party boundaries.
- Infer TypeScript types from Zod schemas when that reduces duplication and keeps runtime validation aligned with compile-time types.
- Keep shared contracts in a dedicated shared package only when both frontend and backend actually consume them. Do not introduce shared packages for one-off types.

## Brevity Rules

- Prefer concise updates. Say what changed, what was verified, and what remains.
- Do not restate the full task or requirements unless correcting a misunderstanding.
- Avoid long explanations of obvious code. Explain intent, tradeoffs, and risky parts only.
- When reporting file changes, group related files instead of describing every small edit.
- For command output, summarize the important result instead of pasting full logs.
- For plans, use short milestones and concrete outcomes. Avoid implementation essays.
- For final responses, keep to 3-6 bullets or 1-3 short paragraphs unless the user asks for detail.
- Include exact errors, failing test names, file paths, and commands when they matter.
- Do not include "next steps" unless they are actionable and relevant.
- If nothing was tested, say that briefly and why.
