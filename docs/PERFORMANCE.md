# Performance

The brief's scale is 10,000 employees. Everything below was measured on the seeded dataset (`npm run seed`) on a development laptop, warm, Node 22.

## Database operations

| Operation | Time |
|---|---|
| Seed 10,000 employees + 13,768 salary-history rows (batched, one transaction) | ~0.5 s |
| Org overview (count, USD payroll, countries) | 1.7 ms |
| Pay by country (aggregates + medians) | 9.8 ms |
| Job-title averages in India | 4.2 ms |
| Payroll by department | 2.8 ms |
| Salary distribution (US) | 1.3 ms |
| List page sorted by USD salary | 1.6 ms |
| List search "smith" | 4.9 ms |
| Filtered list, page 20 | 2.1 ms |

## Import / export (all 10,000 employees)

| Format | File size | Export | Parse | Import (dry run) |
|---|---|---|---|---|
| XLSX | 636 KB | 550 ms | 328 ms | 564 ms |
| CSV | 1.2 MB | 103 ms | 167 ms | 486 ms |

The export → re-import round trip reports all 10,000 rows as *unchanged*, which is also covered by a test at small scale.

## Why it is fast enough without more machinery

- **SQLite in-process** — no network hop; 10k rows fit in memory pages.
- **Indexes match the queries** — country, department, (country, job title), name, email.
- **Current salary denormalised** — lists and aggregates never touch the history table.
- **Server-side paging and filtering** — the browser receives 25 rows, not 10,000.
- **Batched seed/import inside a transaction** — one fsync instead of thousands.
- **UI** — search is debounced (300 ms); the previous page stays on screen while the next loads; the charts bundle (≈108 kB gzipped) loads only on the insights page; the main bundle is ≈220 kB gzipped.

## Where it would need work at larger scale

- **Search** uses `LIKE '%term%'`, a scan. Fine at 10k (≈5 ms); at hundreds of thousands, use SQLite FTS5 or Postgres trigram indexes.
- **Medians** load a group's salaries into memory. Fine at 10k; at much larger scale, use a database with `percentile_cont` (Postgres) or precomputed aggregates.
- **Export** builds the file in memory (≈1 MB here); stream it for very large orgs.
- **Imports** run synchronously in the request (<1 s at 10k); larger files would move to a background job with progress.
