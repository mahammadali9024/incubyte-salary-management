# Working on this repo (instructions for AI coding agents)

- Stack: JavaScript (ES modules), Node 22, Express 5, Drizzle + SQLite, React + Mantine. No TypeScript.
- Validation rules live once, in `packages/shared` (Zod). Use them in routes and forms; never duplicate.
- API layering: routes (HTTP + validation) → services (rules, transactions) → repositories (SQL). Services must not import Express.
- Inject time through the `clock` dependency; never call `new Date()` in a service.
- Money is whole units of the employee's currency; convert with `toUsd` / `salaryInUsd()` only.
- Test first for domain logic. Tests must be fast and deterministic: in-memory DB (`test/db.js`), fixed clock, fixed seeds.
- Before committing: `npm test` and `npm run lint` pass. One concern per commit, message explains why.
- Ask before changing scope; record decisions in `docs/DECISIONS.md`.
