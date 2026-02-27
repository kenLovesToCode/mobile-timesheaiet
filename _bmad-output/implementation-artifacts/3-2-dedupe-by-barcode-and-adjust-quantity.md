# Story 3.2: Dedupe by Barcode and Adjust Quantity

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want duplicate items to increment quantity and to adjust quantities in my list,
so that my shopping list stays accurate without extra rows.

## Acceptance Criteria

1. **Given** an item with a barcode is already on the list **When** I add the same barcode again **Then** the list increments quantity instead of creating a duplicate row.
2. **Given** a list item exists **When** I increase or decrease its quantity **Then** the displayed quantity updates immediately.

## Tasks / Subtasks

- [x] Update shopping list repository behavior (AC: 1, 2)
  - [x] Add explicit repository helpers for increment and set-quantity behavior
  - [x] Preserve product name resolution + product row creation logic
  - [x] Add toggle checked helper (prep for Story 3.3, but needed for UI state now)
- [x] Update Results add-to-list flow for dedupe increment (AC: 1)
  - [x] Keep quantity sheet but ensure add uses increment behavior for duplicates
  - [x] Maintain existing success/error messaging and validation
- [x] Update Shopping List UI for quantity adjustments (AC: 2)
  - [x] Provide +/- controls and enforce min quantity of 1
  - [x] Show checked state and allow toggle (lightweight UI, no clutter)
  - [x] Preserve calm layout and one-handed affordances
- [x] Tests + evidence capture (AC: 1, 2)
  - [x] Repository tests for increment and set-quantity/toggle behavior
  - [x] UI tests for increment-on-add and quantity controls

### Review Follow-ups (AI)

- [x] [AI-Review][High] Prevent quantity increments from exceeding max (decide clamp/reject/increase cap) in `addOrIncrementShoppingListItem` [src/db/repositories/shopping-list-repository.ts:186]
- [x] [AI-Review][High] Make increment atomic to avoid lost updates under concurrent adds [src/db/repositories/shopping-list-repository.ts:180]
- [x] [AI-Review][Medium] Reconcile story File List with actual git changes (currently only story file is untracked) [_bmad-output/implementation-artifacts/3-2-dedupe-by-barcode-and-adjust-quantity.md:179]
- [x] [AI-Review][Medium] Prevent quantity increments above max in Shopping List +/- flow and disable `+` at max [src/features/shopping-list/shopping-list-screen.tsx:69]
- [x] [AI-Review][Medium] Serialize or reconcile rapid quantity taps to avoid lost updates from stale snapshots [src/features/shopping-list/shopping-list-screen.tsx:69]
- [x] [AI-Review][Medium] Serialize toggle writes (or rebase optimistic state) to prevent final checked-state desync on rapid taps [src/features/shopping-list/shopping-list-screen.tsx:91]
- [x] [AI-Review][Low] Replace duplicated `999` in Results quantity validation with `SHOPPING_LIST_QUANTITY_MAX` constant [src/features/results/results-screen.tsx:192]
- [x] [AI-Review][Low] Add UI tests for max boundary, decrement floor, and repository-failure rollback paths [__tests__/story-3-2-shopping-list-ui.test.js:152]
- [x] [AI-Review][High] Add missing repository test coverage for non-integer quantity validation to satisfy stated AC evidence [__tests__/story-3-2-shopping-list-repository.test.js:273]
- [x] [AI-Review][Medium] Strengthen Results AC1 test to verify duplicate add actually increments on second add, not just a single add call [__tests__/story-3-2-shopping-list-ui.test.js:134]
- [x] [AI-Review][Medium] Surface a user-facing inline error/toast when quantity or checked writes fail instead of only logging + silent rollback [src/features/shopping-list/shopping-list-screen.tsx:105]
- [x] [AI-Review][Low] Replace hardcoded `999` in repository test stubs with `SHOPPING_LIST_QUANTITY_MAX` to avoid drift from validation constants [__tests__/story-3-2-shopping-list-repository.test.js:48]

## Dev Notes

### Developer Context

- Story 3.2 builds directly on Story 3.1’s Shopping List foundation. The list already stores `quantity` and `is_checked`; UI is read-only and add-to-list currently overwrites quantity. This story flips dedupe behavior and introduces adjustable quantity controls.
- Maintain the ultra-minimal, one-primary-CTA principle: Results stays “Add to List” as the primary CTA; quantity adjustments live inside the Shopping List screen itself.
- Offline-first and instant UI updates remain non-negotiable. Any add or update should reflect immediately without spinners.

### Story Foundation

- Epic 3 goal: a fast, minimal in-store list that stays clean by deduping barcodes and allows quick quantity adjustments.
- From PRD + UX: one-handed, calm list management; no dead ends; do not introduce heavy forms or multi-step flows.

### UX & Behavior Requirements

- **Results → Add to List:** keep the quantity sheet, but if the barcode already exists, increment by the chosen quantity (not overwrite).
- **Shopping List:** show quantity alongside item; provide simple +/- controls and keep min at 1 (no zero/negative).
- **Checked state:** expose a lightweight checked toggle to preview Story 3.3 behavior (checked = in cart), but keep the UI calm.
- Keep row density minimal; controls must remain ≥44x44 and work with Dynamic Type.

### Technical Requirements

- Repository behavior must be explicit and predictable:
  - `addOrIncrementShoppingListItem({ barcode, quantity, productName? })`: if item exists, add `quantity`; else insert with quantity.
  - `setShoppingListItemQuantity({ barcode, quantity })`: sets to exact value (used by +/- in list).
  - `toggleShoppingListItemChecked({ barcode, isChecked })` or `setShoppingListItemChecked`.
- Continue to validate input with Zod (barcode required, quantity integer ≥ 1, reasonable max).
- Keep current transaction + product row creation pattern intact (do not regress product-name handling).
- Do not modify schema or migrations for this story unless a change is required (current fields already support the behavior).

### Architecture Compliance

- Keep `app/shopping-list.tsx` as a thin route wrapper; UI/state changes live in `src/features/shopping-list/*`.
- All DB access stays in repositories (`src/db/repositories/*`); screens should not import Drizzle/SQLite directly.
- Keep `DatabaseBootstrapGate` expectations unchanged; shopping list reads only after DB is ready.
- Use existing UI primitives and theme tokens; avoid one-off styling.

### Library / Framework Requirements

- Stay on the pinned stack; do not upgrade:
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
  - `tamagui@2.0.0-rc.17`
  - `drizzle-orm@^0.45.1`
  - `drizzle-kit@^0.31.9`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`

### File Structure Requirements

- Repositories + validation:
  - `src/db/repositories/shopping-list-repository.ts` (increment + set quantity + toggle checked)
  - `src/db/validation/shopping-list.ts` (new schemas for quantity updates)
- Feature UI:
  - `src/features/shopping-list/shopping-list-screen.tsx` (quantity controls + checked toggle)
  - `src/features/results/results-screen.tsx` (add flow uses increment behavior)
- Tests:
  - `__tests__/story-3-2-shopping-list-repository.test.js`
  - `__tests__/story-3-2-shopping-list-ui.test.js`
- UI primitives only if needed (prefer existing `ListRow`, `Button`, `Text`, `Surface`).

### Testing Requirements

- Repository tests:
  - Add item twice → quantity increments (not overwrite).
  - Set quantity to explicit value from list controls.
  - Toggle `is_checked` persists and is reflected in list.
  - Validation rejects quantity < 1 or non-integer.
- UI tests:
  - Results add-to-list twice increments item quantity.
  - Shopping List +/- buttons update quantity immediately.
  - Checked toggle updates row state and label.

### Project Structure Notes

- Align with unified structure: `app/` routes are thin; feature logic in `src/features/*`; data in `src/db/*`.
- No structural conflicts expected; use existing shopping list files and patterns from Story 3.1.

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.2)
- PRD: `_bmad-output/planning-artifacts/prd.md` (Shopping List requirements)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (data layer, repo boundaries)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (Direction 5, one primary CTA, list behavior)
- Project context: `_bmad-output/project-context.md` (stack versions, structure rules)
- Existing implementation patterns:
  - `src/db/repositories/shopping-list-repository.ts`
  - `src/features/results/results-screen.tsx`
  - `src/features/shopping-list/shopping-list-screen.tsx`

## Previous Story Intelligence

- Story 3.1 already established the shopping list table, repository, and UI, but **add-to-list overwrites quantity** and the list is **read-only**. This story must change that behavior without breaking product-name coalescing or the Results UX flow.
- Results add-to-list uses a modal quantity sheet; reuse this pattern and simply change the underlying repo behavior to increment on duplicates.
- Shopping List screen currently uses `ListRow` and renders `isChecked` state but provides no controls; keep this visual style and add minimal controls that preserve the calm layout.

## Git Intelligence Summary

- Recent commits are focused on epic/story documentation and prior Epic 2 work:
  - `epic 3 and epic 4: - created documentation for epic 4 - pre-generated all user stories for epic 4 - started expanding epic 3, story 3.1`
  - `correct course: added epic 4, sprint change proposal`
  - `story(2.7): non-blocking flow behavior`
  - `story(2.6) done`
  - `story(2.5) done with hotfix; story(2.6) started early`
- No recent commits suggest shopping list behavior changes, so this story should be self-contained.

## Latest Technical Information

- Expo SDK 55 aligns with React Native 0.83 and React 19.2; keep the project pinned to the current SDK stack unless an explicit upgrade is requested. citeturn2search0
- Expo’s New Architecture guidance should be followed for SDK 55 projects; do not attempt to disable it or backport old architecture patterns. citeturn2search1
- Drizzle’s Expo SQLite adapter remains `drizzle-orm/expo-sqlite` with Expo SQLite; continue using the repo’s current migration workflow and avoid switching to `expo-sqlite@next` unless upgrading the stack. citeturn2search2turn2search3

## Project Context Reference

- Follow strict TypeScript rules and feature boundaries from `_bmad-output/project-context.md`.
- Keep `app/` route files thin; all DB access via repositories.
- Preserve the existing Tamagui token usage and avoid ad-hoc styles.

## Story Completion Status

- Status set to: in-progress
- Completion note: Review follow-up action items added; implementation updates required before final completion.
- Status set to: review
- Completion note: All Story 3.2 review follow-ups are now implemented and validated with story-targeted tests.
- Status set to: in-progress
- Completion note: Senior code review identified unresolved HIGH/MEDIUM follow-ups; story returned to implementation.
- Status set to: done
- Completion note: All open AI review follow-ups were implemented in a single pass and revalidated.

## Senior Developer Review (AI)

- Date: 2026-02-27
- Reviewer: ken
- Outcome: Changes Requested
- Story status recommendation: in-progress

### Summary

- AC1 and AC2 behavior are implemented in code paths reviewed (`addOrIncrementShoppingListItem`, Shopping List +/- updates, checked toggles).
- Story-targeted validation run during review:
  - `npx jest __tests__/story-3-2-shopping-list-repository.test.js __tests__/story-3-2-shopping-list-ui.test.js --runInBand --watchman=false` (pass)
  - `npm run lint` (pass)
  - `npm run typecheck` (pass)
- Git/story file-list reconciliation: no discrepancies in source/test files under review.

### Findings

1. High: Testing requirement claims non-integer quantity validation coverage, but repository tests only assert `quantity: 0` rejection and never exercise non-integer input (e.g. `1.5`) [__tests__/story-3-2-shopping-list-repository.test.js:271].
2. Medium: AC1 UI evidence is partial; the Results UI test validates a single add call, not the required duplicate-add increment outcome in the UI flow [__tests__/story-3-2-shopping-list-ui.test.js:127].
3. Medium: Shopping List optimistic write failures are only logged and rolled back with no user-facing feedback, causing silent state reversions that are hard to understand during in-aisle use [src/features/shopping-list/shopping-list-screen.tsx:102].
4. Low: Repository test stubs hardcode `999` instead of the shared max constant, creating potential drift between test assumptions and validation rules [__tests__/story-3-2-shopping-list-repository.test.js:48].

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

- Story context created in YOLO mode for Story 3.2.
- Web research performed for Expo SDK 55 + RN 0.83 + Drizzle Expo SQLite guidance.
- Implemented repository increment, quantity update, and checked toggle helpers with validation support.
- Updated Results add-to-list flow to use increment behavior for duplicate barcodes.
- Added Shopping List quantity controls and checked toggle with optimistic UI updates.
- Tests run: `npx jest __tests__/story-3-2-shopping-list-repository.test.js __tests__/story-3-2-shopping-list-ui.test.js --runInBand --watchman=false`.
- Tests run: `npx jest __tests__/story-3-1-shopping-list-repository.test.js --runInBand --watchman=false`.
- ✅ Resolved review finding [High]: Made duplicate increments atomic via SQL `ON CONFLICT` quantity expression to prevent lost updates.
- ✅ Resolved review finding [High]: Added max quantity cap handling (`min(999, current + incoming)`) for increment path.
- ✅ Resolved review finding [Medium]: Reconciled story File List to match current repository changes.
- ✅ Resolved review finding [Medium]: Added max clamp + disabled `+` behavior at `SHOPPING_LIST_QUANTITY_MAX` in Shopping List controls.
- ✅ Resolved review finding [Medium]: Reconciled rapid quantity taps with per-item serialized write-through updates to prevent stale-snapshot overwrites.
- ✅ Resolved review finding [Medium]: Reconciled rapid checked-toggle taps with per-item serialized write-through updates to preserve final intended state.
- ✅ Resolved review finding [Low]: Replaced Results quantity parser hardcoded `999` with shared `SHOPPING_LIST_QUANTITY_MAX`.
- ✅ Resolved review finding [Low]: Added UI tests for max boundary, quantity floor, rapid-tap reconciliation, and optimistic rollback on repository failures.
- Tests run: `npx jest __tests__/story-3-2-shopping-list-repository.test.js --runInBand --watchman=false` (red, then green after fix).
- Tests run: `npx jest __tests__/story-3-2-shopping-list-ui.test.js --runInBand --watchman=false` (pass).
- Tests run: `npx jest __tests__/story-3-2-shopping-list-ui.test.js __tests__/story-3-2-shopping-list-repository.test.js --runInBand --watchman=false` (pass).
- Lint run: `npm run lint` (pass).
- Typecheck run: `npm run typecheck` (pass).
- Full test run: `npx jest --runInBand --watchman=false` (fails due to existing suite issues in Story 2.2/2.3 safe-area test setup and existing act warnings).
- ✅ Resolved review finding [High]: Added non-integer validation test coverage for quantity updates (`quantity: 1.5`).
- ✅ Resolved review finding [Medium]: Strengthened AC1 UI evidence to assert duplicate add flow increments quantity and keeps a single list row.
- ✅ Resolved review finding [Medium]: Added user-facing inline error messaging for quantity/toggle write failures with rollback.
- ✅ Resolved review finding [Low]: Replaced hardcoded max-literal test scaffolding with `SHOPPING_LIST_QUANTITY_MAX`.
- Tests run: `npx jest __tests__/story-3-2-shopping-list-repository.test.js __tests__/story-3-2-shopping-list-ui.test.js --runInBand --watchman=false` (pass).
- Lint run: `npm run lint` (pass).
- Typecheck run: `npm run typecheck` (pass).

### File List

- `_bmad-output/implementation-artifacts/3-2-dedupe-by-barcode-and-adjust-quantity.md`
- `__tests__/story-3-2-shopping-list-ui.test.js`
- `__tests__/story-3-2-shopping-list-repository.test.js`
- `src/features/results/results-screen.tsx`
- `src/features/shopping-list/shopping-list-screen.tsx`
- `src/db/repositories/shopping-list-repository.ts`
- `src/db/validation/shopping-list.ts`

### Change Log

- 2026-02-27: Implemented shopping list dedupe increment, quantity controls, checked toggle, and supporting tests.
- 2026-02-27: Addressed code review findings - 3 items resolved (atomic increment, max-cap enforcement, and artifact file-list reconciliation).
- 2026-02-27: Added 5 new AI review follow-up action items; story moved back to in-progress pending fixes.
- 2026-02-27: Addressed remaining Story 3.2 review findings - 5 additional items resolved (UI max clamp/disable, rapid-tap reconciliation for quantity+toggle, shared max constant usage, and expanded UI regression coverage); story advanced to review.
- 2026-02-27: Senior code review run completed; 4 new follow-ups logged (1 High, 2 Medium, 1 Low) and story returned to in-progress.
- 2026-02-27: Completed one-pass remediation for all 4 open review follow-ups; story validated and moved to done.
