# ACME Salary Management

Web software for an HR Manager to manage salary data for **10,000 employees across 8 countries**, replacing spreadsheets, and to answer questions about how the organisation pays people.

**Stack:** JavaScript · Node 22 · Express 5 · SQLite (Drizzle ORM) · React 19 · Mantine · TanStack Query · Vitest

| | |
|---|---|
| Live demo | _add the Render URL here after deploying_ |
| Demo video | _add link_ |
| Requirements (one page) | [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) |
| Architecture | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Decisions & trade-offs | [docs/DECISIONS.md](docs/DECISIONS.md) |
| Performance | [docs/PERFORMANCE.md](docs/PERFORMANCE.md) |
| How AI was used | [docs/AI_USAGE.md](docs/AI_USAGE.md) |

## What the HR Manager can do

- **Find anyone fast** — search by name/email, filter by country, department and job title, sort (salary sorts by USD equivalent so currencies compare fairly). Filters live in the URL.
- **Add, edit, delete employees** — validated with the same rules on the client and server.
- **Change pay with a history** — every salary change is recorded with an effective date; the employee view shows the history and % change.
- **Answer pay questions** — org totals; min / median / average / max per country (local and USD); average pay per job title within a country; payroll per department; salary distribution per country.
- **Work with Excel** — import `.xlsx`/`.csv` with a preview (new / updated / unchanged, or row-level errors) and all-or-nothing commit; export the filtered list; download a template.

## Run it locally

Requires Node 22.12+ (`nvm use` reads `.nvmrc`).

```bash
npm install
npm run seed          # creates apps/api/data/salary.db with 10,000 employees (~0.5 s)
npm run dev           # API on :3000, UI on http://localhost:5173 (proxies /api)
```

Sign in with the development defaults: `hr@acme.example` / `acme-hr-demo` (override with `HR_EMAIL` / `HR_PASSWORD`).

| Command | What it does |
|---|---|
| `npm test` | All unit, API and component tests (~5 s) |
| `npm run lint` | ESLint |
| `npm run seed -- --reset` | Rebuild the database from scratch |
| `npm run build && npm start` | Production build; the API serves the UI on :3000 |

### Configuration

| Variable | Default | Notes |
|---|---|---|
| `PORT` | `3000` | |
| `DATABASE_PATH` | `data/salary.db` | relative to `apps/api` |
| `SESSION_SECRET` | dev-only value | **required** when `NODE_ENV=production` |
| `HR_EMAIL` / `HR_PASSWORD` | `hr@acme.example` / `acme-hr-demo` | the HR user is created or updated on start |
| `SEED_ON_START` | `false` | seed 10,000 employees if the database is empty |
| `STATIC_DIR` | `apps/web/dist` if built | built UI to serve |

## Deploy (Render, free tier)

The repo includes a [`render.yaml`](render.yaml) blueprint: **New → Blueprint** in Render, pick the repo, and set `HR_PASSWORD` when prompted. One web service builds the UI and serves it from the API. The free tier's disk is ephemeral, so the database is re-seeded when the service restarts — agreed as acceptable for the demo.

## Project layout

```
apps/api         Express API: routes → services (rules) → repositories (SQL)
  src/employees    CRUD, list/search, salary history
  src/insights     pay aggregates, median & histogram
  src/transfer     spreadsheet import/export
  src/auth         HR login (signed session cookie)
  src/db           Drizzle schema, migrations, seed
apps/web         React UI (Vite + Mantine)
packages/shared  Reference data, fixed FX rates and Zod schemas used by both sides
docs/            Requirements, decisions, architecture, performance, AI usage
```

## Tests

116 tests across 20 files, all in-process and deterministic (in-memory SQLite per test, injected clock, fixed seeds):

- **Domain/services** — salary-history rules, list search/sort/filter, insight maths (median, histogram, USD conversion), import validation and all-or-nothing behaviour, seed determinism.
- **HTTP** — every endpoint via supertest, including auth, error mapping, file upload/download and an export → re-import round trip.
- **UI** — form validation and server-error mapping, import dialog flow, app login smoke test.
