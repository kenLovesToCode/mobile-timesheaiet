# Story 3.1: Add to Shopping List with Quantity

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to add a scanned product to my Shopping List with a quantity,
so that I can track what I need to buy while I shop.

## Acceptance Criteria

1. **Given** I’m on Results **When** I choose Add to List **Then** the item is added with a quantity I can set at add time.
2. **Given** I add an item **When** I return to the Shopping List **Then** the item appears with the selected quantity.

## Tasks / Subtasks

- [x] Define shopping list data contract + persistence (AC: 1, 2)
  - [x] Add shopping list table/schema keyed by barcode with quantity + checked state
  - [x] Add repository helpers for add/update/list and quantity handling
  - [x] Validate inputs with Zod and normalize outputs for UI
- [x] Add “Add to List” action from Results (AC: 1)
  - [x] Provide a quantity picker at add time (sheet or modal)
  - [x] Save list item locally and confirm success
  - [x] Ensure Results refresh does not regress existing behavior
- [x] Build Shopping List screen (AC: 2)
  - [x] Render list items with quantity and checked state
  - [x] Show empty state with CTA to Scan/Results
  - [x] Respect one-handed and calm UI direction
- [x] Tests + evidence capture (AC: 1, 2)
  - [x] Repository tests for add/list with quantity
  - [x] UI tests for add-to-list flow and list display

### Review Follow-ups (AI)

- [x] [AI-Review][High] Ensure add-to-list works when barcode has no product row; relax FK or create product row before insert. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/db/schema/shopping-list-items.ts:5]
- [x] [AI-Review][High] Persist product name when adding to list so Shopping List shows identity instead of “Unknown product”. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/results/results-screen.tsx:184]
- [x] [AI-Review][Medium] Move quantity picker into a sheet/modal to preserve one-primary-CTA Results screen. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/results/results-screen.tsx:405]
- [x] [AI-Review][Low] Add UI test coverage for add-to-list error handling and message rendering. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/__tests__/story-3-1-shopping-list-ui.test.js:108]
- [x] [AI-Review][High] Coalesce shopping list product name from list row + products table to avoid returning null when list item has a name. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/db/repositories/shopping-list-repository.ts:22]
- [x] [AI-Review][Medium] Clear add-to-list success feedback when barcode changes to avoid stale confirmations. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/results/results-screen.tsx:147]
- [x] [AI-Review][Medium] Disable Add to List CTA unless Results is ready to avoid adding items without verified identity. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/results/results-screen.tsx:398]
- [x] [AI-Review][High] Guard Shopping List async load against unmount to avoid state updates after navigation. [/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/shopping-list/shopping-list-screen.tsx:27]

## Dev Notes

### Developer Context

- Story 3.1 introduces the Shopping List foundation: add from Results with a quantity and view the list.
- Keep scope tight: do **not** implement dedupe/increment (Story 3.2) or check/uncheck behavior (Story 3.3) yet.
- Add-to-list must be fast and offline-only; Results should remain the “answer” screen and never feel blocked.
- Quantity is set at add time (default 1), saved locally, and visible in the Shopping List.

### Story Foundation

- Epic 3 goal: enable a simple in-store list that is fast, minimal, and usable one-handed.
- PRD + UX require a calm, low-friction flow with one primary action per screen.
- Results should expose a clear “Add to list” action, while store rows remain contextual actions (add/edit price).

### UX & Behavior Requirements

- Results: keep a single primary CTA (Add to list) without cluttering the store rows.
- Add-to-list flow: lightweight quantity selection (fast, minimal typing).
- Shopping List screen: calm list with product name + quantity; empty state should nudge back to Scan/Results.

### Technical Requirements

- Add a shopping list table that stores at minimum:
  - `product_barcode` (text, required, references `products.barcode`)
  - `quantity` (integer, required, default 1)
  - `is_checked` (boolean, default false) for future Story 3.3 (UI can ignore for now)
  - `created_at`, `updated_at` (integer, ms epoch)
- Keep list items uniquely addressable by barcode (prepare for Story 3.2). For Story 3.1, if an item already exists, overwrite quantity rather than incrementing.
- Repository functions should be local-only and typed:
  - `addOrUpdateShoppingListItem({ barcode, quantity })`
  - `listShoppingListItems()` with product name join
  - Optional `getShoppingListItem(barcode)`
- Validate inputs with Zod (barcode required, quantity integer >= 1, reasonable max).
- Results → Add-to-list flow must pass barcode (and known product name if needed for display only).

### Architecture Compliance

- Keep `app/shopping-list.tsx` as a thin route wrapper; move UI/state to `src/features/shopping-list/*`.
- Data access lives in repositories (`src/db/repositories/*`); no direct SQLite/Drizzle usage in screens.
- Preserve `DatabaseBootstrapGate` expectations (all DB work behind the gate).
- Use existing UI primitives (`Text`, `Button`, `Input`, `ListRow`, `Surface`) and theme tokens.
- Maintain route parameter validation patterns similar to `add-edit-price-screen.tsx`.

### Library / Framework Requirements

- Stay on the pinned stack; do not upgrade versions in this story:
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
  - `tamagui@2.0.0-rc.17`
  - `drizzle-orm@^0.45.1`
  - `drizzle-kit@^0.31.9`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`
- Use `drizzle-orm/expo-sqlite` and the existing migration approach.

### File Structure Requirements

- Schema:
  - `src/db/schema/shopping-list-items.ts`
  - Export from `src/db/schema/index.ts`
- Repository + validation:
  - `src/db/repositories/shopping-list-repository.ts`
  - `src/db/validation/shopping-list.ts`
- Feature UI:
  - `src/features/shopping-list/shopping-list-screen.tsx`
  - Update `app/shopping-list.tsx` to render the feature screen.
- Results integration:
  - Update `src/features/results/results-screen.tsx` to add the Add-to-list CTA and quantity prompt.
- Migrations:
  - Add a new `drizzle/*.sql` migration and update `drizzle/migrations.js` via the existing workflow/tooling.

### Testing Requirements

- Use `jest-expo` and existing test conventions (`__tests__/story-3-1-*.test.js`).
- Repository tests:
  - Adds item with quantity.
  - Overwrites quantity when barcode exists (no increment yet).
  - Lists items with product name join (or null name fallback).
- UI tests:
  - Results screen shows Add-to-list CTA.
  - Quantity prompt enforces integer >= 1 and saves.
  - Shopping List renders items with quantity and empty state CTA.
- Mock repositories and router boundaries; no direct SQLite in UI tests.

### Latest Technical Information

- Expo SDK 55 runs on React Native 0.83 with the New Architecture always enabled; do not attempt to disable `newArchEnabled`.
- React 19.2 is the current React line aligned with RN 0.83; this story should not introduce web-only React 19.2 APIs.
- Drizzle’s Expo SQLite docs highlight the `drizzle-orm/expo-sqlite` adapter and migrations workflow; keep using the existing local-migration approach and stay on the repo’s pinned `expo-sqlite` version (do not switch to `expo-sqlite@next` without an explicit upgrade request).

### Project Structure Notes

- Align with unified structure:
  - `app/` routes are thin wrappers.
  - Feature logic/UI in `src/features/*`.
  - DB schema + repositories in `src/db/*`.
  - UI primitives in `src/components/ui/*`.
- No known structural conflicts; add new shopping list files within these boundaries.

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.1)
- PRD: `_bmad-output/planning-artifacts/prd.md` (Shopping List requirements)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (structure + naming + data layer)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (Direction 5, one primary CTA, add-to-list behavior)
- Project context: `_bmad-output/project-context.md` (stack versions, file boundaries, rules)
- Existing patterns:
  - `src/features/results/results-screen.tsx` (Results UX + row interactions)
  - `src/features/pricing/add-edit-price-screen.tsx` (route param validation + form flow)
  - `src/features/scan/scan-screen.tsx` (inline “sheet” pattern)
  - `src/db/repositories/pricing-repository.ts` (transaction + validation patterns)

## Story Completion Status

- Status set to: review
- Completion note: Story implementation complete; tests and validations recorded in Dev Agent Record.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

None

### Completion Notes List

- Story context created in YOLO mode for Story 3.1.
- Web research performed for Expo SDK 55 / RN 0.83 / Drizzle Expo SQLite guidance.
- Validation checklist not run because `_bmad/core/tasks/validate-workflow.xml` is missing.
- Implemented shopping list schema, repository, validation, and migration with repository tests.
- Added Results add-to-list flow with quantity sheet and a Shopping List screen with empty state.
- Tests run: `npx jest __tests__/story-3-1-shopping-list-repository.test.js --runInBand --watchman=false`, `npx jest __tests__/story-3-1-shopping-list-ui.test.js --runInBand --watchman=false`.
- Additional validation: `npx jest --runInBand --watchman=false`, `npm run typecheck`, `npm run lint`.
- Jest suite passes with expected console warnings from existing tests (tamagui setup-zeego prompt, simulated error logs).
- ✅ Resolved review finding [High]: ensured shopping list insert creates a product row when missing.
- ✅ Resolved review finding [High]: persisted product name on list items and passed product name from Results.
- ✅ Resolved review finding [Medium]: moved quantity picker into a modal sheet for a single primary CTA.
- ✅ Resolved review finding [Low]: added UI test coverage for add-to-list error handling.
- ✅ Resolved review finding [High]: coalesced list item product name before product row name; added repository regression test.
- ✅ Resolved review finding [Medium]: clear add-to-list success feedback on barcode changes.
- ✅ Resolved review finding [Medium]: disable Add to List CTA until Results is ready.
- ✅ Resolved review finding [High]: guard Shopping List load against unmount while async work is pending.
- ✅ Resolved review finding [High]: prefer canonical product name over list snapshot and handle product insert races.
- ✅ Resolved review finding [Medium]: add keyboard avoidance + safe-area padding for Add-to-List quantity sheet.
- Senior Developer Review section not present; review follow-ups checklist updated directly.

### File List

- `_bmad-output/implementation-artifacts/3-1-add-to-shopping-list-with-quantity.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `__tests__/story-3-1-shopping-list-repository.test.js`
- `__tests__/story-3-1-shopping-list-ui.test.js`
- `__tests__/story-1-4-navigation-smoke.test.js`
- `drizzle/0004_breezy_shopping_list.sql`
- `drizzle/0005_calm_shopping_list_product_name.sql`
- `drizzle/meta/_journal.json`
- `drizzle/migrations.js`
- `app/shopping-list.tsx`
- `src/db/repositories/shopping-list-repository.ts`
- `src/db/schema/index.ts`
- `src/db/schema/shopping-list-items.ts`
- `src/db/validation/shopping-list.ts`
- `src/features/pricing/add-edit-price-screen.tsx`
- `src/features/results/results-screen.tsx`
- `src/features/shopping-list/shopping-list-screen.tsx`

### Change Log

- 2026-02-26: Implemented shopping list persistence, Results add-to-list flow, Shopping List screen, and related tests.
- 2026-02-26: Addressed code review findings - 4 items resolved (product row insert, product name persistence, quantity sheet, error UI test).
- 2026-02-26: Addressed code review finding - coalesced list item product name with repository regression coverage.
- 2026-02-26: Addressed code review findings - 3 items resolved (results feedback reset, CTA gating, shopping list unmount guard).
- 2026-02-27: Addressed code review findings - canonical product name preference, product insert conflict safety, quantity sheet keyboard avoidance.
