# Story 2.3: Results View for Active Stores

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to see Results for a scanned or entered barcode across my active stores,
so that I can quickly compare prices or see what’s missing.

## Acceptance Criteria

1. **Given** I obtain a barcode (scan or manual) **When** I open Results **Then** I see a row for each Active store.
2. **Given** a store has a saved price for this barcode **When** Results loads **Then** the row shows price and captured timestamp.
3. **Given** a store has no saved price for this barcode **When** Results loads **Then** the row shows a Missing state that is actionable.
4. **Given** a product name is known **When** Results loads **Then** the product name is shown prominently with the barcode visible.

## Tasks / Subtasks

- [x] Confirm Results data contract and active-store ordering (AC: 1, 2, 3, 4)
  - [x] Use `getResultsByBarcodeAcrossActiveStores` as the source of truth for active-store rows
  - [x] Ensure active-store ordering is stable (store name, then id) and preserved in UI
  - [x] Keep Results offline-only (no network) and avoid any remote data dependencies

- [x] Results screen UX for active stores (AC: 1, 2, 3, 4)
  - [x] Render product identity header (product name prominent, barcode visible)
  - [x] Render a row for each active store with price + captured timestamp or Missing
  - [x] Make Missing state actionable (tap row -> add price flow)
  - [x] Provide an empty-state for zero active stores with clear path to Stores

- [x] Error and refresh resilience (AC: 1, 2, 3)
  - [x] Fail closed when barcode context is missing (explicit retry guidance)
  - [x] Surface refresh errors while preserving last loaded rows
  - [x] Keep focus-based refresh so Results updates after add/edit flows

- [x] Performance + accessibility checks (NFRs + UX)
  - [x] Ensure Results load is fast and local (no heavy transformations)
  - [x] Verify accessibility labels for rows and identity header
  - [x] Respect 44x44 tap targets and Dynamic Type

- [x] Tests + evidence capture (AC: 1-4)
  - [x] Add Jest coverage for active-store rows, Missing vs priced rows, and product identity
  - [x] Add regression coverage for missing-barcode error state and retry
  - [x] Add coverage for zero-active-stores empty state + CTA to Stores

### Review Follow-ups (AI)

- [x] [AI-Review][Medium] Add refresh-error regression coverage to ensure last-loaded rows remain visible and retry UI appears after a refresh failure. [`__tests__/story-2-3-results-view.test.js:136`]
- [x] [AI-Review][Medium] Provide a recovery CTA in the missing-barcode error state to navigate back to Scan/manual entry instead of only retrying. [`src/features/results/results-screen.tsx:282`]
- [x] [AI-Review][Medium] Declare `productConflictSet` in the test scope to avoid leaking a global or throwing in strict mode. [`__tests__/story-2-2-pricing-repository.test.js:372`]
- [x] [AI-Review][Low] Update ordering test data to be unsorted so the test validates ordering behavior. [`__tests__/story-2-3-results-view.test.js:101`]

## Dev Notes

### Developer Context

- Story 2.3 focuses on the Results view UX and data presentation for active stores. It should build on the Results infrastructure introduced in Story 2.2 without reworking existing patterns.
- Results is the “answer” screen in the core loop; it must be calm, immediate, and readable one-handed.
- Missing is not an error state; it is a primary, actionable affordance (tap row -> add price).

### Story Foundation

- Epic 2 requires Results to show all active stores, price + captured timestamp, and actionable Missing state.
- Product identity must be obvious (name prominent, barcode visible) to reduce “wrong item” doubt.
- Offline-first is mandatory; Results must not depend on network or remote data.

### UX & Behavior Requirements

- Ultra-minimal Results layout: product identity first, then store rows.
- Clear hierarchy: product name > barcode + timestamp.
- Missing rows are calm but clearly actionable; priced rows are editable.
- Keep one primary CTA on Results (if any); prefer contextual row tap for add/edit.

### Technical Requirements

- Source Results data from `getResultsByBarcodeAcrossActiveStores` (active stores only, ordered by store name then id).
- Product identity comes from the `products` table (by barcode) and must be displayed when known.
- Store rows must show:
  - price (formatted) + captured timestamp when a price exists
  - Missing label when no price exists, with row tap action to add a price
- Barcode context is required; if missing, Results must fail closed with a clear retry path.
- Keep Results refresh lightweight (local DB query only) and preserve focus-based refresh after add/edit flows.
- Maintain offline-first behavior; do not introduce network calls, sync, or analytics.
- Performance: Results should feel instantaneous; align with NFR4 (scan -> results < 3s on success).

### Architecture Compliance

- Keep `app/results.tsx` as a thin route wrapper only; no business logic in route files.
- Keep Results UI and state in `src/features/results/*`.
- Keep DB access in repositories (`src/db/repositories/*`); no direct SQLite access in UI.
- Preserve `DatabaseBootstrapGate` assumptions; Results must not render before DB bootstrap.
- Use existing UI primitives (`Text`, `Button`, `ListRow`, `Surface`) and theme tokens.
- Respect platform adapters for device APIs if introduced later; avoid direct native API access in route files.

### Library / Framework Requirements

- Stay on the repo’s pinned stack (do not upgrade during this story without explicit user request):
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
  - `tamagui@2.0.0-rc.17`
  - `drizzle-orm@^0.45.1`
  - `drizzle-kit@^0.31.9`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`
- Expo Router: use route params to pass barcode context; keep route wrappers thin.
- Drizzle + Expo SQLite: continue using `drizzle-orm/expo-sqlite` and bundled migrations.
- UI: use project tokens and existing primitives; do not introduce ad hoc styling or new UI libs.

### File Structure Requirements

- Route wrapper (thin): `app/results.tsx`
- Feature screen + logic: `src/features/results/results-screen.tsx`
- Results perf instrumentation (if used): `src/features/results/results-refresh-performance.ts`
- Repository source: `src/db/repositories/pricing-repository.ts`
- UI primitives: `src/components/ui/*` (reuse existing)
- Tests (new): `__tests__/story-2-3-results-view.test.js` (or follow existing naming pattern)

### Testing Requirements

- Use `jest-expo` and match existing mocking patterns.
- Add tests that assert:
  - Renders a row for each active store (priced and Missing states).
  - Missing row is actionable (tap triggers add-price navigation).
  - Product name (when known) is prominent and barcode is visible.
  - Captured timestamp is displayed for priced rows.
  - Missing barcode context fails closed with retry guidance.
  - Zero active stores shows the empty state with CTA to Stores.
- Mock repository and router boundaries; do not depend on SQLite in UI tests.

### Previous Story Intelligence

- Story 2.2 already introduced a Results screen slice and pricing repository; extend it rather than re-architecting.
- Preserve the focus-based refresh pattern so Results updates immediately after add/edit flows.
- Keep row tap behavior guarded to avoid duplicate navigation pushes.
- Keep strict route-param validation (barcode/storeId) and fail closed on malformed context.
- Maintain refresh error UX (show last loaded rows + retry) instead of silently failing.

### Git Intelligence Summary

Recent commits show the Results and pricing foundation landed in Story 2.2. Build on these files rather than creating parallel flows:
- `story(2.2): done add or edit price and product info`
- `story(2.1): store setup and gating`
- `after-setup(done): add project context`
- `epic(1): done with retrospective`
- `story(1.5) ui system setup theme tokens base components`

### Latest Technical Information

- Expo SDK 55 is the current major SDK release and aligns with React 19 and React Native 0.83; keep the repo pinned to the Expo 55 preview stack unless explicitly upgrading.
- Expo Router and Expo SQLite versions should track the SDK 55 line; avoid mixing versions from other SDKs.
- Drizzle’s Expo SQLite integration expects the Expo SQLite driver and its adapter (`drizzle-orm/expo-sqlite`).
- Zod 4 is the current major Zod line; keep schema validation on Zod 4 in this codebase.
- Tamagui and Expo Router in this repo are preview/RC builds; avoid upgrades without compatibility checks.

### Project Structure Notes

- Follow the unified project structure and feature boundaries defined in `_bmad-output/project-context.md`.
- Prefer `src/features/results/*` for UI/state and `src/db/repositories/*` for data access.

### References

- PRD: `_bmad-output/planning-artifacts/prd.md`
- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.3)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project context rules: `_bmad-output/project-context.md`

## Story Completion Status

- Status set to: done
- Completion note: Added Results missing-barcode recovery CTA, expanded refresh-error regression coverage, tightened ordering test data, and fixed pricing repository test scoping.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- Validate Results data contract and ordering through existing repository usage and UI ordering checks.
- Extend Results header accessibility labeling while keeping route wrapper thin.
- Add focused Jest coverage for Results active-store rendering, Missing/price states, product identity, and empty state.
- Run full Jest suite to confirm no regressions before moving story to review.

### Debug Log References

- None

### Completion Notes List

- Story context created in YOLO mode for story 2.3.
- Validation checklist task could not be run because `_bmad/core/tasks/validate-workflow.xml` is missing in this repo.
- Added Results identity accessibility label and verified active-store rendering/order behavior.
- Added `story-2-3-results-view` Jest coverage for active-store rows, Missing vs priced states, product identity, empty state, and focus refresh.
- Full Jest run completed; existing suites pass with expected console warnings.
- `npm run lint` completed successfully.
- Added Results missing-barcode recovery CTA, expanded refresh-error regression coverage, tightened ordering test data, and fixed pricing repository test scoping.

### File List

- `__tests__/story-2-2-pricing-repository.test.js`
- `__tests__/story-2-3-results-view.test.js`
- `_bmad-output/implementation-artifacts/2-3-results-view-for-active-stores.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `src/features/results/results-screen.tsx`

## Change Log

- 2026-02-26: Implemented Results accessibility header labeling, added Story 2.3 Results view test coverage, updated repository test fixtures for active stores, ran full Jest + lint, and moved story to `review`.
- 2026-02-26: Addressed code review findings (missing-barcode recovery CTA, refresh-error regression coverage, ordering test data, pricing repository test scoping) and moved story to `done`.
