# Story 2.2: Add or Edit Price and Product Info

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to add or update product info and store-specific prices from Results,
so that missing or incorrect prices are fixed immediately.

## Acceptance Criteria

1. **Given** I’m on Results with a Missing store row **When** I tap the row to add price **Then** the add flow opens with the store selected and barcode prefilled.
2. **Given** the product name is unknown **When** I add a price **Then** I can enter the product name in the same flow.
3. **Given** I save a price **When** the save completes **Then** the captured timestamp is stored automatically.
4. **Given** I save a price **When** I return to Results **Then** the store row updates immediately with the new price.
5. **Given** I save a price **When** the save completes **Then** Results reflects the updated row within 0.5 seconds (P95).
6. **Given** a store already has a price **When** I choose to edit it **Then** I can update the price and see Results update immediately.

## Tasks / Subtasks

- [x] Expand SQLite/Drizzle schema for products + prices (AC: 2, 3, 4, 6)
  - [x] Add `products` table schema under `src/db/schema/` with at minimum barcode identity, product name, and timestamps
  - [x] Add `prices` table schema under `src/db/schema/` for store-specific price capture with store linkage and captured timestamp
  - [x] Add unique constraints/indexes to prevent duplicate product identities and duplicate store+product price rows
  - [x] Export new tables from `src/db/schema/index.ts` so Drizzle schema remains complete
  - [x] Add bundled Drizzle migration SQL + update migration metadata/journal so native bootstrap still applies migrations on app start

- [x] Add validated pricing/product repository APIs behind `src/db/` boundaries (AC: 1, 2, 3, 4, 6)
  - [x] Create Zod validation schemas/errors for add/edit price payloads (barcode, store id, price, optional product name)
  - [x] Implement repository operation(s) to create/update product info and upsert store-specific price in one logical flow
  - [x] Ensure save path auto-populates captured timestamp (do not trust UI input for timestamps)
  - [x] Return normalized result shapes for Results UI (avoid leaking raw DB rows or nullable ambiguity into route files)
  - [x] Add query helpers for Results rows by barcode across active stores (minimum slice needed for Story 2.2)

- [x] Replace Results placeholder with a feature-driven Results screen slice sufficient for price add/edit loop (AC: 1, 4, 5, 6)
  - [x] Keep `app/results.tsx` thin and delegate to `src/features/results/*`
  - [x] Render product identity area (name + barcode) and active store rows using existing primitives/tokens
  - [x] Show row state as priced vs Missing with clear row affordances (`Missing` row = add, priced row = edit)
  - [x] Refresh results data on focus/return from add-price flow so saved changes appear immediately
  - [x] Keep scope narrow: do not implement camera/manual entry/recent scans flow wiring here beyond what is required to exercise Results

- [x] Implement Add/Edit Price flow UI on the existing `add-price` route (AC: 1, 2, 3, 4, 6)
  - [x] Keep `app/add-price.tsx` thin and delegate to `src/features/pricing/*`
  - [x] Read route params for barcode + store context (and optional edit mode identifiers) using Expo Router parameter APIs
  - [x] Prefill store and barcode, allow product name entry when missing, and support price editing when an existing value is present
  - [x] Provide dismiss/cancel path that returns to Results without blocking the user (aligns with future Story 2.7 expectations)
  - [x] Guard against duplicate submit taps / in-flight saves (carry-forward lesson from Story 2.1)

- [x] Preserve architecture and project structure boundaries (AC: 1-6)
  - [x] Keep DB access in repositories (`src/db/repositories/*`), not in `app/` route files
  - [x] Keep feature UI/state logic in `src/features/results/*` and `src/features/pricing/*`
  - [x] Reuse existing UI primitives (`Text`, `Button`, `Input`, `ListRow`, `Surface`) and theme tokens before creating new primitives
  - [x] Follow naming/style conventions (`kebab-case`, typed payloads, `import type`, strict TypeScript)

- [x] Add focused automated coverage and evidence capture for the add/edit loop (AC: 1-6)
  - [x] Add Story 2.2 tests covering Missing row -> add flow, product-name-required path, timestamp save behavior (repository-level), and immediate Results refresh on return
  - [x] Mock router params/navigation and repository boundaries to keep tests deterministic (`jest-expo` style)
  - [x] Include regression coverage for edit-existing-price path and focus-based Results refresh
  - [x] Run relevant validations (`npm run typecheck`, `npm run lint`, targeted Story 2.2 tests) and record evidence precisely

### Review Follow-ups (AI)

- [x] [AI-Review][High] Remove fake default barcode fallback in Results and fail closed when route barcode context is missing. [src/features/results/results-screen.tsx:27]
- [x] [AI-Review][High] Validate `storeId` existence (and rely on/enforce SQLite foreign keys) before saving price rows to prevent orphan `prices` records. [src/db/repositories/pricing-repository.ts:57]
- [x] [AI-Review][Medium] Add explicit AC5 performance evidence or measurement for `save -> Results refresh <= 0.5s (P95)` with real performance instrumentation/observations; synthetic mocked timing tests are not sufficient proof. [__tests__/story-2-2-price-add-edit-flow.test.js:445]
- [x] [AI-Review][High] Surface a retryable error when focus-based Results refresh fails after stale rows are already visible (do not silently hide refresh failures). [src/features/results/results-screen.tsx:123]
- [x] [AI-Review][Medium] Verify/canonicalize store context by `storeId` in Add/Edit Price flow instead of trusting route `storeName` display text. [src/features/pricing/add-edit-price-screen.tsx:111]
- [x] [AI-Review][Medium] Restore real route-wrapper coverage in Story 1.4 navigation smoke test by mocking feature screens instead of `app/results` and `app/add-price`. [__tests__/story-1-4-navigation-smoke.test.js]
- [x] [AI-Review][Medium] Remove misleading AC5 "P95 evidence" claim from synthetic delayed-refresh test and keep it as AC4 regression coverage only. [__tests__/story-2-2-price-add-edit-flow.test.js:445]
- [x] [AI-Review][Low] Include year in Results captured timestamp labels for older prices so recency remains unambiguous. [src/features/results/results-screen.tsx:45]
- [x] [AI-Review][Medium] Replace state-only submit guard with a synchronous in-flight latch (for example, `useRef`) so rapid double taps cannot enter `handleSave` twice before re-render. [src/features/pricing/add-edit-price-screen.tsx:155]
- [x] [AI-Review][Medium] Canonicalize product-name context for Add/Edit Price by barcode (or avoid sending unchanged route `productName`) to prevent stale route params from overwriting newer saved product names. [src/features/pricing/add-edit-price-screen.tsx:162]
- [x] [AI-Review][Medium] Scope Results refresh performance summaries to a specific barcode/run session so AC5 P95 evidence cannot be contaminated by prior in-session samples. [src/features/results/results-refresh-performance.ts:89]
- [x] [AI-Review][Medium] Use canonical barcode/product state (not only route `productName`) to decide whether product name is required in Add/Edit Price, so stale blank route params do not block valid saves. [src/features/pricing/add-edit-price-screen.tsx:87]
- [x] [AI-Review][Medium] Scope AC5 runtime perf logger summaries (the `console.info` path) by barcode/run session so logged P95 evidence cannot be contaminated by unrelated samples. [src/features/results/results-refresh-performance.ts:85]
- [x] [AI-Review][Low] Preserve the original price capture timestamp on product-name-only edits (or only refresh `capturedAt` when `priceCents` changes) so Results recency labels stay trustworthy. [src/db/repositories/pricing-repository.ts:130]
- [x] [AI-Review][High] Reconcile Add/Edit Price `productName` form state with canonical product lookup (without clobbering actual user edits) so stale route params cannot overwrite newer saved product names. [src/features/pricing/add-edit-price-screen.tsx:74]
- [x] [AI-Review][Medium] Do not false-block saves when canonical product prefetch fails; keep product-name-required gating resilient to lookup errors and let repository validation enforce requirements. [src/features/pricing/add-edit-price-screen.tsx:162]
- [x] [AI-Review][Medium] Strict-parse numeric route params (`storeId`, `priceCents`) and fail closed on malformed values instead of accepting loose `parseInt` coercions. [src/features/pricing/add-edit-price-screen.tsx:70]
- [x] [AI-Review][Medium] Queue (or uniquely key) pending Results refresh perf measurements so overlapping save cycles for the same barcode do not overwrite/misattribute AC5 instrumentation samples. [src/features/results/results-refresh-performance.ts:46]
- [x] [AI-Review][Medium] Reset Add/Edit Price form state and edit-tracking refs when route params change/reuse the same `/add-price` route instance, to avoid stale product name/price values leaking between contexts. [src/features/pricing/add-edit-price-screen.tsx:87]
- [x] [AI-Review][Medium] Add a row-tap navigation latch (or temporary row disable) in Results so rapid taps cannot push duplicate `/add-price` screens for the same row. [src/features/results/results-screen.tsx:147]
- [x] [AI-Review][High] Fix migration order so `products` is created before `prices` (FK dependency) to avoid clean-migration failure with `PRAGMA foreign_keys=ON`. [drizzle/0002_aspiring_invisible_woman.sql:1]
- [x] [AI-Review][Medium] Prevent initial store-context error flash by treating valid `storeId` as resolving until verification completes. [src/features/pricing/add-edit-price-screen.tsx:106]
- [x] [AI-Review][Medium] Reload Results when `barcode` param changes while screen is focused (not just on focus). [src/features/results/results-screen.tsx:83]
- [x] [AI-Review][Medium] Require product name when existing product row has empty/null name, not only when product row is missing. [src/db/repositories/pricing-repository.ts:83]
- [x] [AI-Review][Low] Add TTL/size cap cleanup for pending refresh measurements to avoid unbounded growth when Results is never revisited. [src/features/results/results-refresh-performance.ts:46]
- [x] [AI-Review][Medium] Add a cancel/back action while verifying store context so users are not trapped if lookup is slow or fails. [src/features/pricing/add-edit-price-screen.tsx:357]
- [x] [AI-Review][Medium] Move AC5 timing instrumentation to capture the UI update (not just fetch completion), or explicitly document it as fetch-only timing. [src/features/results/results-screen.tsx:112]
- [x] [AI-Review][Low] Avoid showing “Loading product...” header while Results is in an error state to prevent conflicting messaging. [src/features/results/results-screen.tsx:211]
- [x] [AI-Review][Low] Only bump `products.updatedAt` when product metadata changes to keep product freshness meaningful. [src/db/repositories/pricing-repository.ts:116]
- [x] [AI-Review][High] Block saves for inactive stores so Results visibility stays consistent with add/edit flows. [src/db/repositories/pricing-repository.ts:66]
- [x] [AI-Review][Medium] Use LIFO pending refresh measurements to avoid misattributed save->refresh samples when completions overlap. [src/features/results/results-refresh-performance.ts:119]

## Dev Notes

### Developer Context

- Story 2.2 is the first real vertical slice of the Results -> Add/Edit Price loop and unlocks the product/price contribution mechanic that drives MVP value.
- Story ordering note: `2.2` depends on Results interactions before Story `2.3` (full Results view) is formally scheduled. Implement the minimum Results slice required for add/edit behavior now, and leave broader Results polish/coverage for Story `2.3`.
- This story should establish the canonical data model and repository patterns for `products` and `prices`; later stories (Results, scan fallback, shopping list) will build on these decisions.

### Story Foundation

- Epic 2 goal is the instant lookup and contribution loop; this story implements the contribution half (fix missing/incorrect prices immediately).
- ACs emphasize:
  - contextual entry from Results row (store selected + barcode prefilled)
  - product name capture in the same flow
  - automatic timestamp capture
  - immediate Results refresh after save
  - edit existing price path (not create-only)
- PRD + UX repeatedly frame “Missing” as a normal, actionable state and require instant local updates offline.

### Technical Requirements

- Persist product and price data locally in SQLite via Drizzle (offline-first, no network/API).
- Support a single save flow that can:
  - create or update product info for a barcode (at minimum `name`)
  - create or update a store-specific price for the same barcode/product
  - stamp captured timestamp automatically on save
- Add/edit flow inputs:
  - barcode is prefilled from Results and should not rely on manual re-entry in the normal path
  - store is preselected from tapped row context
  - product name is editable/required when unknown; editable when correcting existing data
  - price is editable for both create and edit flows
- Results refresh behavior must be immediate after save (local re-query on focus/return is acceptable and likely simplest for the current codebase).
- Meet NFR2 intent (`<= 0.5s` P95 local update) by keeping save + refresh local and lightweight:
  - no network calls
  - no heavy global invalidation system required
  - avoid unnecessary route remount churn
- Keep unsaved form persistence out of scope (PRD explicitly allows unsaved add-price form loss on app close/crash).

### Architecture Compliance

- Keep route files thin:
  - `app/results.tsx` -> feature screen wrapper only
  - `app/add-price.tsx` -> feature screen wrapper only
- Keep DB logic and normalization in repositories/validation under `src/db/`.
- Preserve root shell/bootstrap boundaries:
  - `DatabaseBootstrapGate` remains the native migration/readiness gate
  - no route should bypass DB bootstrap assumptions
- Follow existing cross-platform discipline:
  - if platform differences emerge (keyboard/input behavior, native-only APIs later), prefer adapters or feature modules instead of branching directly in route files
- Reuse existing `ListRow` pattern for tappable store rows and state labeling (`Missing` vs priced) before inventing a new row pattern.

### Library / Framework Requirements

- Stay on the repo’s pinned stack (do not upgrade during this story without explicit user request):
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
  - `drizzle-orm@^0.45.1`
  - `drizzle-kit@^0.31.9`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`
- Expo Router:
  - Use route params for barcode/store context into `add-price` flow (prefer local search params in route component scope)
  - Keep stack configuration centralized in the existing root layout/shell
- Drizzle + Expo SQLite:
  - Continue using `drizzle-orm/expo-sqlite` with bundled migrations
  - Prefer Drizzle insert/update APIs (and upsert conflict handling where appropriate) rather than raw SQL strings in feature code
- UI:
  - Reuse project primitives/tokens and preserve accessibility labels + 44x44 touch targets
  - Keep “Missing” calm/actionable (not danger/error-red) per UX guidance

### File Structure Requirements

- Expected route updates:
  - `app/results.tsx`
  - `app/add-price.tsx`
- Expected new/updated feature modules (indicative; adapt to repo conventions):
  - `src/features/results/*`
  - `src/features/pricing/*`
- Expected DB/data-layer additions:
  - `src/db/schema/products.ts`
  - `src/db/schema/prices.ts`
  - `src/db/schema/index.ts`
  - `src/db/repositories/*` (pricing/results repositories or query helpers)
  - `src/db/validation/*` (pricing/product validation)
  - `drizzle/*.sql`
  - `drizzle/meta/*`
  - `drizzle/migrations.js` (only if generated bundle export changes)
- Likely supporting UI reuse:
  - `src/components/ui/list-row.tsx` (reuse as-is if possible; extend only if story-specific metadata rendering needs it)

### Testing Requirements

- Follow current Jest + `jest-expo` patterns and deterministic mocking style used in Story 2.1 tests.
- Prefer behavior assertions over implementation details:
  - tap Missing row opens add flow with correct store/barcode context
  - product name can be entered when unknown
  - save path triggers repository with expected payload and stores timestamp automatically (repository test)
  - returning to Results shows updated row immediately (focus refresh regression test)
  - tap priced row opens edit flow and saving updates visible price
- Mock router boundaries (`expo-router`) and repository functions rather than real SQLite in UI tests.
- Add repository-level tests for validation/normalization/upsert logic if feasible (especially duplicate row prevention and timestamp stamping).
- Run smallest relevant validation set:
  - `npm run typecheck`
  - `npm run lint`
  - targeted Story 2.2 test file(s)

### Previous Story Intelligence

- Story 2.1 established key patterns that should be reused, not reworked:
  - thin route wrappers with feature modules in `src/features/*`
  - repository calls + local refresh pattern for immediate UI updates
  - `useFocusEffect` refresh on screen return (important for Results refresh after add/edit save)
  - centralized validation error handling (`StoreValidationError` style) in `src/db/validation/*`
- Story 2.1 review/follow-up lessons to carry forward:
  - guard duplicate submits with in-flight flags
  - add regression tests for focus-return state refresh (AC4-style issue already surfaced once)
  - isolate row tap interactions from nested controls to avoid accidental double actions
  - keep artifact evidence claims precise (do not over-claim runtime performance without observed evidence)

### Git Intelligence Summary

- Recent commit pattern shows implementation + tests + BMAD artifact/status updates shipped together (`story(2.1): store setup and gating`).
- Recent work created the foundation this story should extend:
  - real Stores UI in `src/features/stores/*`
  - scan gating state in `src/features/scan/*`
  - `stores` schema/repository/validation patterns in `src/db/*`
  - sprint status and story artifact tracking conventions
- Use the same structural approach for Results/Pricing instead of introducing a separate architecture pattern.

### Latest Technical Information

- Expo Router docs continue to place provider/bootstrap initialization in `app/_layout.tsx` / root layout, which matches the current `RootStackLayout` pattern and supports keeping `results`/`add-price` route files thin.
- Expo Router URL parameter docs document local search params for route-specific params; this is the right fit for passing `barcode`, `storeId`, and edit context into the `add-price` route without global state coupling.
- Expo SDK 55 SQLite docs document `openDatabaseSync(...)`, prepared statements/transactions, and optional change listeners; the project already uses `openDatabaseSync`, and focus-based re-query is a low-risk default while live-query adoption remains optional.
- Drizzle Expo SQLite docs document `drizzle-orm/expo-sqlite` integration, `useMigrations`, and optional `useLiveQuery` when SQLite change listeners are enabled. If the dev agent considers live queries, it must also update DB initialization intentionally (not casually).
- Drizzle insert docs document conflict-handling/upsert patterns (`onConflictDoUpdate`) that are relevant for product/price save flows; prefer these patterns (or an equivalent transaction-safe approach) over ad hoc “check then insert” race-prone logic.
- Project-specific override remains critical: even if docs show newer releases, do not upgrade Expo Router / Expo / Tamagui preview stack versions in Story 2.2.

### Project Context Reference

- Primary agent guardrails: `_bmad-output/project-context.md`
- Planning sources:
  - `_bmad-output/planning-artifacts/epics.md`
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`

### Project Structure Notes

- `app/results.tsx` and `app/add-price.tsx` are currently placeholder routes and are the main route entry points to convert in this story.
- `src/components/shell/root-stack-layout.tsx` already registers both `results` and `add-price` stack screens, so this story can implement feature behavior without changing top-level route registration unless modal presentation options are intentionally adjusted.
- `src/features/stores/stores-screen.tsx` and `src/features/scan/scan-screen.tsx` are the current examples for feature-screen composition, local loading/error states, and focus-based refresh.
- `src/db/schema/index.ts` currently exports `dev-smoke` and `stores`; Story 2.2 should extend this cleanly with `products` and `prices` as foundational domain tables.
- `src/components/ui/list-row.tsx` already supports state labels and accessory content, which is a strong base for Results store rows (`Missing`, price/timestamp metadata, row-tap action).

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 2 / Story 2.2)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR16-FR21, FR22-FR23, NFR2, offline-first constraints)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (SQLite + Drizzle + Zod, feature boundaries, naming conventions)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (Results readability, Missing->Add Price flow, sheet/modal guidance, trust cues)]
- [Source: `_bmad-output/project-context.md` (pinned versions, route thinness, DB bootstrap, testing rules)]
- [Source: `_bmad-output/implementation-artifacts/2-1-store-setup-and-active-gating.md` (carry-forward patterns and review learnings)]
- [Source: `package.json`]
- [Source: `app/results.tsx`]
- [Source: `app/add-price.tsx`]
- [Source: `app/_layout.tsx`]
- [Source: `src/components/shell/root-stack-layout.tsx`]
- [Source: `src/components/shell/placeholder-screen.tsx`]
- [Source: `src/features/stores/stores-screen.tsx`]
- [Source: `src/features/scan/scan-screen.tsx`]
- [Source: `src/components/ui/list-row.tsx`]
- [Source: `src/components/ui/input.tsx`]
- [Source: `src/components/ui/button.tsx`]
- [Source: `src/db/client.ts`]
- [Source: `src/db/bootstrap-gate.native.tsx`]
- [Source: `src/db/repositories/store-repository.ts`]
- [Source: `src/db/validation/stores.ts`]
- [Source: `src/db/schema/stores.ts`]
- [Source: `__tests__/story-2-1-store-setup-and-gating.test.js`]
- [Source: `https://docs.expo.dev/router/advanced/root-layout/`]
- [Source: `https://docs.expo.dev/router/advanced/stack/`]
- [Source: `https://docs.expo.dev/router/reference/url-parameters/`]
- [Source: `https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/`]
- [Source: `https://orm.drizzle.team/docs/connect-expo-sqlite`]
- [Source: `https://orm.drizzle.team/docs/insert`]

## Completion Status

- Story 2.2 context created and ready for implementation
- Comprehensive dev guardrails added for schema, repositories, Results routing, and Add/Edit Price flow
- Sprint tracking should mark this story as `ready-for-dev` after create-story completion

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-02-25: Create-story workflow executed for first backlog item in `sprint-status.yaml` (`2-2-add-or-edit-price-and-product-info`)
- 2026-02-25: Analyzed `epics.md`, `architecture.md`, `project-context.md`, PRD/UX requirements, and Story 2.1 implementation artifact
- 2026-02-25: Reviewed current repo route/feature/DB patterns (`results` + `add-price` placeholders, `stores`/`scan` feature modules, DB repository conventions)
- 2026-02-25: Performed official-docs web pass for Expo Router params/layout, Expo SQLite SDK 55 guidance, and Drizzle Expo SQLite/upsert patterns
- 2026-02-25: Implemented `products` + `prices` schemas, validation/repository save/query helpers, and generated Drizzle migration `0002_aspiring_invisible_woman` with updated journal/snapshot/bundle exports
- 2026-02-25: Replaced `results`/`add-price` placeholder routes with thin feature-driven wrappers and built `src/features/results/*` + `src/features/pricing/*` add/edit loop UI
- 2026-02-25: Added Story 2.2 UI + repository tests (missing->add, product-name-required, timestamp stamping, edit path, focus refresh) and validated with `npm run typecheck`, `npm run lint`, and targeted Jest runs
- 2026-02-25: Resumed Story 2.2 after review; fixed Results missing-barcode fallback, added store existence validation + SQLite foreign-key PRAGMA, and added AC5 timing evidence test
- 2026-02-25: Applied second review-fix pass: added visible Results refresh error + retry for stale refresh failures, validated/canonicalized store context by `storeId` in Add/Edit flow, restored real route-wrapper smoke coverage, and removed misleading AC5 P95 evidence claim from synthetic test
- 2026-02-25: Ran validation suite after review fixes: targeted Story 2.2 Jest tests, `npm run typecheck`, `npm run lint`, and full `npx jest --runInBand --watchman=false`
- 2026-02-25: Added save->Results refresh instrumentation plus a Jest-only observation harness (20 mocked-loop samples logged) and re-ran targeted + full validation suites (not sufficient AC5 acceptance evidence)
- 2026-02-26: Captured real iOS simulator runtime AC5 evidence from Results add/edit loop instrumentation (20 save->refresh samples, final reported `p95=30.0ms`)
- 2026-02-26: Resolved final post-AC5 review follow-ups (timestamp year labels, synchronous submit latch, product-name payload guard, scoped refresh summaries) and re-ran targeted + full validation suites
- 2026-02-26: Resolved final 2 review follow-ups (canonical product-name-required gating and scoped runtime perf logger summaries) and re-ran targeted + full validation suites
- 2026-02-26: Resolved latest 4 review follow-ups (product-name reconciliation, lookup-failure save gating resilience, strict numeric route param parsing, and capturedAt preservation on product-name-only edits) and re-ran targeted + full validation suites
- 2026-02-26: Resolved remaining review follow-ups (migration order, store-context resolve flash, barcode-change refresh, empty product-name requirement, pending refresh TTL/cap) and re-ran targeted validations

### Completion Notes List

- Implemented local `products` and `prices` SQLite/Drizzle schema tables with unique store+product price rows, timestamp columns, and bundled migration metadata updates
- Added `src/db/validation/pricing.ts` and `src/db/repositories/pricing-repository.ts` for validated add/edit payload parsing, product+price upsert flow, auto-captured timestamps, and Results row normalization across active stores
- Replaced placeholder `results` and `add-price` routes with thin wrappers over feature screens that support Missing/add and priced/edit row affordances plus focus-based Results refresh on return
- Add/Edit Price flow now reads Expo Router params (barcode/store/edit context), supports required product name when unknown, prefilled edit values, cancel/back navigation, and duplicate-submit guards
- Validation results:
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js __tests__/story-2-2-pricing-repository.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
- ✅ Resolved review finding [High]: Removed fake barcode fallback in Results and fail-closed when route barcode context is missing (with UI regression coverage)
- ✅ Resolved review finding [High]: Validated `storeId` existence before save and enabled SQLite foreign-key enforcement in DB client initialization
- ✅ Resolved review finding [High]: Results refresh failures after prior load now surface a retryable inline error while keeping the last loaded rows visible
- ✅ Resolved review finding [Medium]: Add/Edit Price flow now verifies store context by `storeId`, canonicalizes stale route store-name params, and keeps the save flow available
- ✅ Resolved review finding [Medium]: Story 1.4 navigation smoke test now exercises real `app/results` and `app/add-price` route wrappers (feature screens mocked instead)
- ✅ Resolved review finding [Medium]: Removed misleading synthetic AC5 P95 "evidence" claim; delayed refresh test now documents AC4 regression coverage only
- ⚠️ Partial review follow-up only: Added save->Results refresh instrumentation (`src/features/results/results-refresh-performance.ts`) and a Jest-only observation harness; this improves regression visibility but does **not** satisfy AC5 acceptance evidence
- ✅ Resolved review finding [Medium]: Add/Edit Price route barcode context is now trimmed/fail-closed before rendering the form (with UI regression coverage)
- ✅ Resolved review finding [Low]: Results captured timestamp metadata now includes date + time to improve recency trust for older prices
- ✅ Resolved review finding [Medium]: Captured real runtime AC5 evidence on iOS simulator using `results-refresh-performance` logs (`samples=20`, final `p95=30.0ms`, max observed in shared log sample `36.0ms`)
- ✅ Resolved review finding [Low]: Results captured timestamp labels now include the year for older prices (with UI regression coverage)
- ✅ Resolved review finding [Medium]: Add/Edit Price save flow now uses a synchronous `useRef` in-flight latch so rapid double taps cannot re-enter `handleSave` before re-render
- ✅ Resolved review finding [Medium]: Edit mode now avoids sending unchanged route `productName` values, preventing stale route params from overwriting newer product names (while still sending user-edited names)
- ✅ Resolved review finding [Medium]: Results refresh performance summaries now support barcode + run-window scoping (`sinceMeasuredAtMs`) to isolate AC5 evidence sessions
- ✅ Resolved review finding [Medium]: Add/Edit Price product-name-required gating now checks canonical product state by barcode (with regression coverage for stale blank route params)
- ✅ Resolved review finding [Medium]: Runtime `results-perf` `console.info` summaries now scope to barcode + current run window to avoid cross-sample contamination
- ✅ Resolved review finding [Low]: Price repository now preserves `capturedAt` when a save only changes product metadata and leaves `priceCents` unchanged (with repository regression coverage)
- ✅ Resolved review finding [High]: Add/Edit Price product-name form state now reconciles to canonical barcode lookup results without overwriting in-progress user edits
- ✅ Resolved review finding [Medium]: Canonical product lookup failures no longer false-block saves; UI gating defers final enforcement to repository validation when prefetch errors occur
- ✅ Resolved review finding [Medium]: Add/Edit Price route numeric params (`storeId`, `priceCents`) are now strict-parsed and malformed values fail closed before rendering the save form
- ✅ Resolved review finding [Low]: Product `updatedAt` now only changes when metadata changes, with repository regression coverage
- ✅ Resolved review finding [Medium]: Results refresh perf instrumentation now explicitly labels fetch-only timing in code/logs to avoid overstating UI paint latency
- Validation results (review follow-up pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js __tests__/story-2-2-pricing-repository.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅ (all suites pass; existing test files emit non-blocking `act(...)` console warnings)
- Validation results (second review-fix pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅
  - `npx jest __tests__/story-1-4-navigation-smoke.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
- Validation results (instrumentation regression pass; not AC5 acceptance evidence):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js __tests__/story-2-2-pricing-repository.test.js --runInBand --watchman=false` ✅ (Jest runtime instrumentation logs show 20 mocked-loop save->refresh samples)
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅
- Validation results (AC5 runtime evidence pass on iOS simulator):
  - Observed `INFO [results-perf] save->refresh ...` logs across 20 manual save->return loops on `Results` for barcode `0123456789012`
  - Final reported sample: `INFO [results-perf] save->refresh 15.7ms (samples=20, p95=30.0ms)` ✅
  - Acceptance check: `p95=30.0ms <= 500ms` ✅
- Validation results (final review follow-up pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅
- Validation results (final 2 review follow-ups pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅
- Validation results (latest 4 review follow-ups pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js __tests__/story-2-2-pricing-repository.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅
- ✅ Resolved review finding [Medium]: Results refresh instrumentation now queues overlapping same-barcode save cycles to avoid sample loss
- ✅ Resolved review finding [Medium]: Add/Edit Price resets form state and edit-tracking refs when route params change on a reused screen instance
- ✅ Resolved review finding [Medium]: Results row taps now use a navigation latch to prevent duplicate `/add-price` pushes
- ✅ Resolved remaining review follow-ups: migration order now creates `products` before `prices`, add/edit flow treats valid store as resolving until verified, Results reloads on focused barcode changes, repository requires product name when existing record is blank, and refresh measurement queue includes TTL/size caps
- ✅ Resolved review finding [Medium]: Added cancel/back action while verifying store context so users can exit slow or failed store lookups
- ✅ Resolved review finding [Medium]: Documented AC5 timing instrumentation as fetch-only and clarified instrumentation logging
- ✅ Resolved review finding [Low]: Results error state no longer shows the “Loading product...” header to avoid conflicting messaging
- ✅ Resolved review finding [Low]: Product `updatedAt` now only bumps when metadata changes, preserving meaningful freshness
- ✅ Resolved review finding [High]: Prevented saves for inactive stores to keep Results visibility consistent
- ✅ Resolved review finding [Medium]: Updated refresh performance sampling to avoid misattributing overlapping refresh completions
- Validation results (final 3 review follow-ups pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅
- Validation results (remaining review follow-ups pass):
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js __tests__/story-2-2-pricing-repository.test.js --runInBand --watchman=false` ✅ (console warnings about Tamagui zeego setup and expected error logs during negative-path tests)
- Validation results (full regression pass):
  - `npx jest --runInBand --watchman=false` ✅ (console warnings from expected negative-path logs)
- Validation results (verifying-store-context cancel/back pass):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅ (console warnings about Tamagui zeego setup, expected error logs, and act warnings)
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅ (console warnings from expected negative-path logs and act warnings)
- Validation results (AC5 instrumentation fetch-only note):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅ (console warnings about Tamagui zeego setup, expected error logs, and act warnings)
- Validation results (Results error header cleanup):
  - `npx jest __tests__/story-2-2-price-add-edit-flow.test.js --runInBand --watchman=false` ✅ (console warnings about Tamagui zeego setup, expected error logs, and act warnings)
- Validation results (product updatedAt preservation):
  - `npx jest __tests__/story-2-2-pricing-repository.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅ (console warnings from expected negative-path logs and act warnings)

### File List

- `_bmad-output/implementation-artifacts/2-2-add-or-edit-price-and-product-info.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `__tests__/story-1-4-navigation-smoke.test.js`
- `__tests__/story-2-2-price-add-edit-flow.test.js`
- `__tests__/story-2-2-pricing-repository.test.js`
- `app/add-price.tsx`
- `app/results.tsx`
- `drizzle/0002_aspiring_invisible_woman.sql`
- `drizzle/meta/0002_snapshot.json`
- `drizzle/meta/_journal.json`
- `drizzle/migrations.js`
- `src/db/repositories/pricing-repository.ts`
- `src/db/repositories/store-repository.ts`
- `src/db/client.ts`
- `src/db/schema/index.ts`
- `src/db/schema/prices.ts`
- `src/db/schema/products.ts`
- `src/db/validation/pricing.ts`
- `src/features/pricing/add-edit-price-screen.tsx`
- `src/features/results/results-screen.tsx`
- `src/features/results/results-refresh-performance.ts`

## Change Log

- 2026-02-25: Implemented Story 2.2 local product/price persistence, validated pricing repository upsert/query helpers, Results/Add Price feature screens for the add/edit loop, Story 2.2 tests, and migration bundle updates; moved story to `review`.
- 2026-02-25: Senior developer AI code review completed; created 3 review follow-up action items (2 High, 1 Medium) and returned story to `in-progress`.
- 2026-02-25: Addressed first code review findings - fixed Results fail-closed barcode handling and store existence/foreign-key enforcement; also added a synthetic delayed-refresh test (later corrected because it did not prove AC5 P95).
- 2026-02-25: Addressed second code review findings - added retryable stale-refresh error UX, verified store context by `storeId` in Add/Edit flow, restored real route-wrapper smoke coverage, and removed misleading AC5 P95 evidence claim; story remains `in-progress` because AC5 evidence is still pending.
- 2026-02-25: Added save->Results refresh performance instrumentation and a Jest-only observation harness (20 mocked-loop samples); kept story `in-progress` because AC5 still lacks real runtime/device evidence.
- 2026-02-25: Addressed additional review findings by canonicalizing stale route `storeName` while preserving verified `storeId` save flow, trimming/fail-closing add-price barcode route context, improving Results recency timestamp display (date+time), and downgrading the AC5 timing test to instrumentation regression coverage only.
- 2026-02-26: Captured real iOS simulator AC5 timing evidence (`samples=20`, `p95=30.0ms`) from runtime instrumentation logs, closed the remaining review follow-up, and returned Story 2.2 to `review`.
- 2026-02-26: Senior developer AI code review pass found 4 additional follow-ups (3 Medium, 1 Low) covering duplicate-submit race hardening, product-name route-context trust, instrumentation evidence scoping, and older-price recency label ambiguity; returned story to `in-progress`.
- 2026-02-26: Addressed final 4 review follow-ups (older-price year label, synchronous save latch, stale route product-name overwrite guard, and scoped refresh summary filtering), added regression coverage, and returned Story 2.2 to `review`.
- 2026-02-26: Senior developer AI code review pass found 2 additional Medium follow-ups (route-snapshot product-name requirement gating and unscoped runtime perf summary logging); added action items and returned Story 2.2 to `in-progress`.
- 2026-02-26: Addressed the final 2 Medium review follow-ups (canonical product-name-required gating and scoped runtime perf logger summaries), added regression coverage, and returned Story 2.2 to `review`.
- 2026-02-26: Senior developer AI code review pass found 4 additional follow-ups (1 High, 2 Medium, 1 Low) covering stale route product-name overwrite risk, lookup-failure false blocking, loose route numeric parsing, and captured-timestamp trust on product-name-only edits; added action items and returned Story 2.2 to `in-progress`.
- 2026-02-26: Addressed the latest 4 review follow-ups (capturedAt preservation on product-name-only edits, product-name form reconciliation without clobbering user edits, lookup-failure save gating resilience, and strict numeric route param parsing), added regression coverage, and returned Story 2.2 to `review`.
- 2026-02-26: Senior developer AI code review pass found 3 additional Medium follow-ups (overlapping AC5 instrumentation sample loss, add-price route param reuse stale form state, and duplicate Results row tap navigation pushes); added action items and returned Story 2.2 to `in-progress`.
- 2026-02-26: Addressed the final 3 review follow-ups (queued AC5 measurement samples, add-price param reuse form reset, Results row navigation latch), added regression coverage, and returned Story 2.2 to `review`.
- 2026-02-26: Addressed remaining review follow-ups (migration order, store-context resolve flash, focused barcode-change refresh, empty product-name requirement, pending refresh TTL/cap), re-ran targeted validations, and returned Story 2.2 to `review`.
- 2026-02-26: Added cancel/back action while verifying store context, added regression coverage for the verification state, and re-ran typecheck/lint/full Jest; story remains `in-progress` with remaining follow-ups.
- 2026-02-26: Documented AC5 Results refresh instrumentation as fetch-only timing, updated perf logs, and re-ran targeted Story 2.2 tests; story remains `in-progress` with remaining follow-ups.
- 2026-02-26: Suppressed the “Loading product...” header while Results is in an error state, added regression coverage, and re-ran Story 2.2 tests; story remains `in-progress` with remaining follow-ups.
- 2026-02-26: Preserved `products.updatedAt` when product metadata is unchanged, added repository regression coverage, and re-ran typecheck/lint/full Jest; story remains `in-progress` with remaining follow-ups.
- 2026-02-26: Completed remaining review follow-ups, re-ran validations, and moved Story 2.2 back to `review`.
- 2026-02-26: Blocked saves for inactive stores and updated Results refresh perf sampling to avoid misattribution; added repository regression coverage and moved Story 2.2 to `done`.

## Senior Developer Review (AI)

### Review Date

- 2026-02-25

### Outcome

- Changes Requested

### Summary

- AC1/AC2/AC3/AC4/AC6 are implemented in code/tests, with defects noted below.
- AC5 refresh behavior exists, but the `<= 0.5s (P95)` target is not yet evidenced/validated.
- Story status moved from `review` back to `in-progress` pending follow-up fixes.

### Findings

- [High] Results screen falls back to a fake barcode (`0123456789012`) when route context is missing, which can show/edit the wrong product context. (`src/features/results/results-screen.tsx`)
- [High] `saveStorePrice` does not verify store existence before upsert, and the current DB client setup does not explicitly enable SQLite foreign-key enforcement. (`src/db/repositories/pricing-repository.ts`, `src/db/client.ts`)
- [Medium] The Story 2.2 UI regression test verifies focus refresh behavior but does not validate AC5 timing (`<= 0.5s P95`). (`__tests__/story-2-2-price-add-edit-flow.test.js`)

### Follow-up Fix Passes (AI)

- 2026-02-25 follow-up pass 1 resolved the barcode fallback and store FK validation issues, but the AC5 evidence claim was only a synthetic delayed-refresh test and did not prove the P95 SLA.
- 2026-02-25 follow-up pass 2 resolved newly identified code/test issues (stale refresh error visibility, route store-name mismatch handling, route-wrapper smoke coverage masking) and removed the misleading AC5 P95 evidence claim.
- Story remains `in-progress` because AC5 still lacks real performance evidence/measurement for the `<= 0.5s (P95)` target.

### Additional Review Pass (AI)

- 2026-02-26 review pass identified 4 remaining issues after AC5 runtime evidence capture: 3 Medium (duplicate-submit race still state-only, stale route `productName` can overwrite newer DB data, and unscoped instrumentation summary can contaminate AC5 evidence) and 1 Low (older-price timestamp labels still omit year).
- Added 4 new unchecked `Review Follow-ups (AI)` action items and returned the story to `in-progress`.

### Latest Review Pass (AI)

- 2026-02-26 review pass identified 2 remaining Medium issues: Add/Edit Price still derives product-name-required gating from route snapshot state (can false-block valid saves when route params are stale), and the AC5 runtime perf logger still logs an unscoped P95 summary that can mix unrelated samples.
- Added 2 new unchecked `Review Follow-ups (AI)` action items and returned the story to `in-progress`.

### Current Review Pass (AI)

- 2026-02-26 review pass identified 4 additional issues: 1 High (stale route product name can overwrite newer canonical product name on save), 2 Medium (canonical product lookup failure can falsely block valid saves, and route numeric params are parsed too loosely with `parseInt`), and 1 Low (product-name-only edits refresh price `capturedAt`, weakening Results recency trust).
- Added 4 new unchecked `Review Follow-ups (AI)` action items and returned the story to `in-progress`.

### Latest Review Pass (AI)

- 2026-02-26 review pass identified 3 additional Medium issues: overlapping same-barcode save cycles can overwrite pending AC5 refresh instrumentation samples, `/add-price` form state can go stale when route params change on a reused route instance, and rapid Results row taps can push duplicate add/edit screens.
- Added 3 new unchecked `Review Follow-ups (AI)` action items and returned the story to `in-progress`.
