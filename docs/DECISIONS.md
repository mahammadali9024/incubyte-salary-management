# Decisions log

Short, dated records of the choices that shaped the solution. Newest last.

## 1. Clarify before building
Questions on insights, currency, salary structure, scope, fields, auth, import/export, seed data, deployment and timeline were raised before any code. Answers are reflected in [REQUIREMENTS.md](./REQUIREMENTS.md).

## 2. Stack: JavaScript end-to-end (Node/Express + React)
- **API:** Node 22 + Express 5 + Zod + Drizzle ORM on SQLite (better-sqlite3), modern ES modules.
  Express is the de-facto Node web framework the team knows; Zod schemas are shared with the UI so validation rules live in one place; Drizzle is a thin SQL layer — insights are plain aggregates and should read like SQL.
- **UI:** React + Vite + Mantine + TanStack Query. Mantine gives accessible tables/forms quickly; TanStack Query handles server state and caching.
- **Monorepo** with npm workspaces: `apps/api`, `apps/web`, `packages/shared`.
- **Types without TypeScript:** JSDoc on public functions for editor help; correctness is guarded by Zod validation at the boundaries and by tests.

## 3. SQLite, single deployable
The brief suggests SQLite; 10k rows is tiny for it. The API serves the built UI, so the app is one Render service with one URL and no CORS. Storage on Render's free tier is ephemeral — data reseeds on redeploy, which was agreed acceptable for the demo.

## 4. Current salary denormalised + history table
`employees.annual_salary` holds the current salary (fast list/aggregate queries); `salary_changes` records every change with an effective date, written in the same transaction as the update.

## 5. Money as integers
Salaries are whole currency units (annual gross), stored as integers — no floating-point drift. USD conversion happens at read time using fixed rates (see 7).

## 6. Fixed insights instead of free-form questions
Predictable, fast, fully testable, no external LLM dependency.

## 7. Exchange rates as versioned code, not a table
Each country has exactly one currency, so aggregates are grouped by currency in SQL and converted to USD in a small, tested function. Keeping `USD_PER_UNIT` in `packages/shared` means rate changes are code-reviewed and the same rates are visible to the UI. A table becomes worthwhile only if HR needs to edit rates themselves.
