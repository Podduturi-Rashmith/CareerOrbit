# Code Quality Audit Map

This document prioritizes refactor work by risk, complexity, and impact on maintainability.

## Priority Tiers

- P0: Admin API routes and persistence helpers (high risk, high churn)
- P1: Admin UI pages with large inlined logic
- P2: Shared route and utility consistency
- P3: Non-critical styling/readability polish

## High-Priority Targets

### P0 - API and Data Layer

- `app/api/admin/jobs/[id]/tailor/route.ts`
  - Very large route handler with mixed concerns (validation, extraction, prompt construction, rewriting, persistence).
  - Inline heuristics and parsing logic reduce readability and testability.
- `app/api/admin/jobs/[id]/tailor/[draftId]/download/route.ts`
  - Paragraph construction logic is dense and uses repeated heuristics.
- `app/api/admin/jobs/route.ts`
  - Repeats payload parsing and required-field checks.
- `app/api/admin/jobs/[id]/route.ts`
  - Repeats payload parsing and required-field checks.
- `lib/admin/jobs-store.ts`
  - Repeated ID generation helper, no shared timestamp/id conventions.
- `lib/admin/master-resume-store.ts`
  - Repeated ID helper, normalization logic not reusable elsewhere.
- `lib/admin/tailored-resume-store.ts`
  - Repeated ID helper and duplicated collection boilerplate.

### P1 - Admin UI

- `app/admin/applications/page.tsx`
  - Multiple workflow concerns in one component; state and effects tightly coupled.
- `app/admin/students/page.tsx`
  - High UI and state complexity likely to benefit from section-level extraction.
- `app/admin/jobs/view/page.tsx`
  - Filtering, edit flow, and rendering are colocated; hard to scan.
- `app/admin/jobs/add/page.tsx`
  - Form validation and submit logic can be clearer with extracted helpers.

### P2 - Shared Consistency

- `lib/db/mongodb.ts`
  - Stable implementation; minor naming and comments only.
- Route-level payload parsing patterns
  - Opportunity for shared schema validation with `zod`.

## Execution Order

1. Normalize API/lib naming and helper usage without behavior changes.
2. Refactor admin UI pages into smaller sections while preserving behavior.
3. Add schema validation and stronger TypeScript domain typing.
4. Add tests for critical admin flows (tailoring + jobs CRUD + parsing edge cases).
5. Run full quality gate (`lint`, `build`, tests) before commit.
