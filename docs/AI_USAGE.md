# How AI was used

The solution was built with **Claude Code** (Anthropic's agentic coding CLI, model Claude Opus 5.5) working in this repository. The developer set direction, made the product decisions, and reviewed each step; the agent drafted plans, code, tests and docs, ran them, and committed in small steps.

## Workflow

1. **Read the brief, ask before building.** The agent was asked for open questions first. It produced ten (insights, currency, salary structure, scope, fields, auth, import/export, seed data, deployment, timeline); the developer answered them, and the answers became [REQUIREMENTS.md](REQUIREMENTS.md).
2. **Plan, then approve.** A written plan (architecture, data model, commit sequence, verification) was reviewed before any code.
3. **Test first for domain logic.** For each feature the agent wrote failing tests, ran them to see them fail, then implemented until green — services and pure functions first, HTTP next, UI last.
4. **Verify against reality, not just tests.** After unit tests, the agent seeded the full 10,000 rows and benchmarked every query, round-tripped a 10,000-row export back through import, ran a production-mode build, and drove the UI in a browser.
5. **One concern per commit**, each with tests, lint and a message explaining why.

## Representative prompts

> "Go through the assessment PDF and the recruiter's email — do you have any open questions for this assignment?"

> "Fixed questions instead of free form. Fine to reseed the data on redeploy."

> "Need JavaScript, React, Node/Express for backend — rewrite the commits."

> Build each feature test-first; keep services independent of HTTP; reuse the shared Zod schemas on both sides; measure performance on 10,000 rows.

## Where human judgement changed the outcome

| Decision                                                                     | Effect                                                                                                                           |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Free-form, natural-language questions → **fixed insights**                   | Removed an LLM dependency, API key and cost; results are deterministic and testable                                              |
| **JavaScript + Express** instead of the agent's initial TypeScript + Fastify | History was rewritten before any push so the commits show the final stack from the start; the service layer was reused unchanged |
| **Reseed on redeploy** accepted                                              | Allowed SQLite on Render's free tier instead of adding a hosted database                                                         |
| Import **and** export required                                               | Became the all-or-nothing import with preview                                                                                    |

## Where the agent's first attempt was wrong (and how it was caught)

- **Sorting salaries across currencies.** The first list test sorted raw amounts, which would rank ₹1,800,000 above $90,000. Spotted while writing the test; salary now sorts by a USD expression in SQL, and list rows carry `annualSalaryUsd`.
- **A wrong expected value** in the histogram test (counted 3 people in the first band, the correct answer was 2). The failing run exposed the test, not the code; the expectation was fixed.
- **API drift in new library versions.** Drizzle's better-sqlite3 driver has no `.iterator()`; `typescript-eslint` and `eslint-plugin-react` did not yet support the newest TypeScript/ESLint majors. Each was caught by a failing run and resolved by pinning or simplifying, never by forcing installs.
- **Fresh-release caution.** Express 5.3.0 was six days old, so 5.2.1 was pinned.
- **Seed library in devDependencies** — would have broken seeding on the production server; caught by reviewing how the deploy starts.
- **Session expiry UX** — the first UI version would have left a stale screen on a 401; a global handler now returns to login.

## Checks the agent ran beyond unit tests

- Nested-transaction behaviour in better-sqlite3 (an inner failure must roll back the whole import) — verified with a throwaway script before relying on it.
- Benchmarks on the full dataset (see [PERFORMANCE.md](PERFORMANCE.md)).
- Production-mode smoke test: fresh empty database → seed on start → UI served for deep links → API protected → `Secure; HttpOnly; SameSite=Lax` cookie.
- Browser walkthrough of login, list, search, detail drawer with salary history, insights, export.

## What was deliberately not delegated

Product scope and trade-offs (what to leave out and why), answering the clarifying questions, choosing the stack, and accepting each plan before implementation.
