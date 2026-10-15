# Salary Management — Requirements (one page)

## Goal
Replace ACME's spreadsheet-based salary management with a web application that lets the **HR Manager** maintain salary data for ~10,000 employees across multiple countries, and answer common questions about how the organisation pays people — quickly, correctly, and without spreadsheet gymnastics.

## User
A single persona: the **HR Manager**. Comfortable with Excel, not technical. Needs speed on a large list, confidence that edits are correct, and answers to pay questions without building pivot tables.

## Scope & features

| Area | Feature | Why it matters |
|---|---|---|
| Employee records | List with server-side pagination, search (name/email), filters (country, department, job title), sorting | 10k rows must feel instant; HR finds people the way they do in Excel |
| | Add / edit / delete employee with validation | Core "manage" job; validation prevents the bad data spreadsheets allow |
| Salary | Gross annual base salary stored in the employee's **local currency** | Matches how people are actually paid |
| | **Salary history**: every change recorded with an effective date | HR is routinely asked "when did their pay change and by how much?" |
| Insights (fixed) | Min / max / average salary **per country** (local + USD) | Headline pay-question from the brief |
| | Average salary **per job title within a country** | Fair-pay / benchmarking question |
| | Headcount and total payroll **per department** (USD) | Budget question |
| | Salary distribution per country (histogram) | Spot outliers and compression |
| | Org totals: headcount, payroll (USD), countries | At-a-glance context |
| Currency | Cross-country figures converted to USD at **fixed, documented rates** | Comparisons across countries need one unit |
| Excel bridge | **Import** CSV/XLSX: validate every row, preview errors, then commit all-or-nothing (upsert by email) | HR's data lives in Excel today; migration must be safe |
| | **Export** current (filtered) list to CSV/XLSX | HR will keep sharing data in Excel |
| Access | Single HR Manager login (session cookie) | Salary data is sensitive; nothing should be publicly readable |
| Data | Deterministic seed script with 10,000 realistic employees | Demo and performance at real scale |

**Employee fields:** full name, email (unique), job title, department, country, currency (derived from country), employment type (full-time / part-time / contract), joining date, annual salary.

## Deliberately out of scope (and why)

| Left out | Reasoning |
|---|---|
| Payroll runs, payslips, tax & deductions | A different product (payroll) with country-specific legal rules; the brief is about *managing* salary data and *understanding* pay |
| Bonus / allowance / equity components | Base salary answers the brief's questions; components multiply the data model and UI for little demo value. The model can grow a `compensation_components` table later |
| Free-form / natural-language questions | Fixed insights cover the core questions with predictable, testable results and no external AI dependency or cost |
| Multiple users, roles, audit of *who* changed what | One persona in the brief. Salary history already records *what* changed and *when* |
| Live exchange rates | Fixed rates make numbers reproducible and tests deterministic; rates are a single table to update |
| Employee self-service, approvals workflows | Not the HR Manager's problem as stated |
| Persistent production storage | Demo deploy on a free tier; reseeding on redeploy was agreed acceptable. Moving to Postgres is a config-level change behind the repository layer |

## Success criteria
- HR can find, edit and re-salary any of 10,000 employees in a few clicks; list and insight responses stay well under 200 ms.
- Every insight number is reproducible from the data and covered by tests.
- An Excel file with bad rows is rejected with row-level reasons, never half-imported.
