# Story 2.1: Store Setup and Active Gating

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to create and manage my stores and mark which ones are active,
so that scanning and results are relevant to where I shop.

## Acceptance Criteria

1. **Given** I open the Stores screen **When** I add a store name and save **Then** the store appears in the list.
2. **Given** a store exists **When** I edit its name **Then** the updated name is shown in the list.
3. **Given** a store exists **When** I toggle it Active/Inactive **Then** its active status updates immediately.
4. **Given** I try to access Scan with zero active stores **When** I open the Scan screen **Then** I am guided to activate at least one store before scanning.

## Tasks / Subtasks

- [x] Expand SQLite/Drizzle schema for MVP `stores` entity and wire migrations (AC: 1, 2, 3, 4)
  - [x] Add `stores` table schema in `src/db/schema/stores.ts` with snake_case columns (at minimum: `id`, `name`, `is_active`, `created_at`, `updated_at`)
  - [x] Export the new table from `src/db/schema/index.ts` so `src/db/client.ts` Drizzle schema includes it
  - [x] Add a Drizzle SQL migration in `drizzle/` and update `drizzle/migrations.js` so native bootstrap continues to apply bundled migrations
  - [x] Preserve existing `DatabaseBootstrapGate` behavior in `src/db/bootstrap-gate.native.tsx` (no regressions to startup gating)

- [x] Implement validated store repository operations behind `src/db/` boundary (AC: 1, 2, 3, 4)
  - [x] Create store input validation (Zod) and error shape(s) consistent with existing `src/db/validation/dev-smoke.ts` patterns
  - [x] Add repository functions for list/create/update/toggle active and active-count lookup (or equivalent query helpers)
  - [x] Normalize repository return types for UI consumption (do not leak raw DB row ambiguity into route files)
  - [x] Ensure create/edit/toggle operations update timestamps and persist across app restart via SQLite

- [x] Build Stores feature UI using existing primitives/tokens (AC: 1, 2, 3)
  - [x] Keep `app/stores.tsx` thin and delegate to `src/features/stores/*` screen/component module(s)
  - [x] Reuse `Text`, `Button`, `Input`, `ListRow`, `Surface` and theme tokens; avoid ad hoc styling in route file
  - [x] Support add store flow with clear save action and validation feedback
  - [x] Support edit store flow (inline, sheet, or focused subview) without breaking one-handed usability
  - [x] Support Active/Inactive toggle with explicit accessible labeling for each store row/switch

- [x] Add Scan active-store gating behavior (AC: 4)
  - [x] Replace `app/scan.tsx` placeholder-only behavior with feature-driven scan entry state logic (still no camera implementation required in this story)
  - [x] Query active-store availability before showing scan-ready UI
  - [x] If zero active stores, show a calm gating screen/state with one primary CTA to manage stores (no dead disabled scanner)
  - [x] Preserve future compatibility with camera permission adapter flow in `src/features/scan/permissions/*`

- [x] Maintain architecture and project-structure compliance (AC: 1, 2, 3, 4)
  - [x] Keep business logic/data access out of `app/` route files
  - [x] Create feature modules under `src/features/stores/` and `src/features/scan/` as needed
  - [x] Follow naming conventions (`kebab-case` files, `PascalCase` components, `camelCase` functions)
  - [x] Keep reusable UI/state helpers in `src/` instead of duplicating logic across route files

- [x] Add focused automated coverage and capture evidence (AC: 1, 2, 3, 4)
  - [x] Add a Story 2.1 test (recommended pattern: `__tests__/story-2-1-store-setup-and-gating.test.js`) covering store CRUD/toggle UI behavior and scan gating rendering
  - [x] Mock DB/repository and router boundaries as needed to keep tests deterministic (follow current test style)
  - [x] Run and record relevant validations: `npm run typecheck`, `npm run lint`, and targeted tests
  - [x] Keep artifact evidence claims precise (no over-claiming runtime behavior without observed proof)

## Dev Notes

### Developer Context

- This is the first feature story of Epic 2 and the foundation for the full scan/results loop.
- Story 2.1 should deliver real persistence + UI behavior (not placeholder-only) for store management and scan gating.
- Camera scanning, haptics, torch, manual entry fallback, and results rendering are out of scope for this story; implement only the prerequisite store setup and active gating.

### Story Foundation

- Epic 2 goal: enable the instant price lookup/contribution loop; active stores are a prerequisite for meaningful scan/results behavior.
- Story 2.1 directly covers FR1-FR5 and the gating prerequisite used by later scan/results stories.
- The UX spec explicitly calls for a calm, non-blocking gating path when no active stores exist and a single primary CTA.

### Technical Requirements

- Persist stores locally in SQLite via Drizzle (offline-first, no network/API).
- At minimum, support:
  - create store (name)
  - edit store name
  - toggle active/inactive
  - list stores with active state
  - active-store count/availability check for scan gating
- Use Zod validation for user-entered store names before repository writes.
- Immediate UI updates are required after create/edit/toggle (optimistic or fast local re-query both acceptable if behavior is immediate).
- Do not introduce React Query for this story (reserved for future sync/backup work); local repository + feature state is sufficient.

### Architecture Compliance

- Keep route files thin:
  - `app/stores.tsx` and `app/scan.tsx` should delegate to feature modules under `src/features/*`.
- Keep DB access behind repository/helpers in `src/db/` (no direct SQL/Drizzle calls in route components).
- Follow existing cross-platform adapter pattern:
  - preserve `*.native.*` / `*.web.*` strategy where platform behavior differs.
- Respect existing bootstrapping boundary:
  - `DatabaseBootstrapGate` in root stack remains the native DB readiness gate.

### Library / Framework Requirements

- Use the repo’s pinned stack in `package.json` (do not upgrade dependencies in this story):
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `drizzle-orm@^0.45.1`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`
- Continue using Expo Router stack routes already defined in `src/components/shell/root-stack-layout.tsx`.
- Reuse existing UI primitives and theme tokens from `src/components/ui/*` and `src/theme/*`.
- If using switches/toggles, preserve accessibility labeling and 44x44 minimum touch targets.

### File Structure Requirements

- Expected route updates:
  - `app/stores.tsx`
  - `app/scan.tsx`
- Expected new/updated feature modules (indicative; adapt minimally to repo patterns):
  - `src/features/stores/*`
  - `src/features/scan/*` (gating state/UI only; no camera scan implementation)
- Expected DB/data-layer additions:
  - `src/db/schema/stores.ts`
  - `src/db/schema/index.ts`
  - `src/db/repositories/*` (store repository)
  - `src/db/validation/*` (store validation)
  - `drizzle/*.sql`
  - `drizzle/migrations.js`
- Optional reusable UI helpers:
  - `src/components/ui/*` or feature-local store row/gating components, if reuse is clear

### Testing Requirements

- Follow current Jest + `jest-expo` conventions and deterministic mocking style seen in `__tests__/story-1-4-navigation-smoke.test.js`.
- Prefer behavior assertions over implementation details:
  - store appears after save
  - edit updates visible name
  - toggle updates active state indicator
  - scan route shows gating state when no active stores
  - scan route shows scan-ready placeholder/next-state when at least one active store exists
- Mock router navigation and DB/repository boundaries as needed.
- Run the smallest relevant validation set:
  - `npm run typecheck`
  - `npm run lint`
  - targeted Story 2.1 test file(s)

### Previous Story Intelligence

- No previous story exists in Epic 2 (this is `2.1`), so there is no same-epic implementation artifact to mine.
- Carry-forward lessons from Epic 1 retrospective and Story 1.4 artifact:
  - Keep route files thin and delegate logic to `src/` modules.
  - Preserve dev-only tooling isolation and do not accidentally ship debug behavior through feature work.
  - Be precise in artifact evidence claims and file lists to avoid review churn.
  - Reuse the native/web boundary and bootstrap patterns instead of reworking them.

### Git Intelligence Summary

- Recent commits show a pattern of completing implementation plus BMAD artifact/status updates together (`story(1.5)`, `epic(1): done with retrospective`).
- Foundation work already established:
  - root stack + route registration
  - DB bootstrap/migrations path
  - camera permission adapter abstraction
  - tokenized UI primitives and 44x44 touch-target patterns
- Story 2.1 should extend these foundations, not replace them.

### Latest Technical Information

- Expo Router docs continue to treat `app/_layout.tsx` as the root initialization boundary (appropriate for keeping providers/bootstrap centralized while feature routes stay thin).
- Expo Router navigation/layout docs document `Stack` configuration and `Stack.Protected`, which aligns with the project’s existing guard pattern in `app/_layout.tsx`.
- Expo SQLite docs for SDK 55 show `openDatabaseSync(...)` support, matching the current `src/db/client.ts` pattern.
- Drizzle Expo SQLite docs continue to support the `drizzle-orm/expo-sqlite` driver and Expo migration integration pattern already used in `src/db/bootstrap-gate.native.tsx` + `drizzle/migrations.js`.
- Project rule override: even when upstream docs discuss newer versions, this story must stay on the repo’s pinned preview/RC stack unless the user explicitly requests an upgrade story.

### Project Context Reference

- Primary agent guardrails: `_bmad-output/project-context.md`
- Planning sources:
  - `_bmad-output/planning-artifacts/epics.md`
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`

### Project Structure Notes

- Current `app/stores.tsx` and `app/scan.tsx` are placeholder routes backed by `PlaceholderScreen`; Story 2.1 should replace placeholder-only behavior with feature-driven UI while preserving shell consistency.
- Current DB schema exports only `dev_smoke_records`; Story 2.1 is the first real domain table expansion and should set the pattern for future entities (`products`, `prices`, `recent_scans`, `shopping_list_items`).
- `src/components/ui/list-row.tsx` already models row interactions + accessibility patterns and is a strong base for store list rows before inventing a new row component.
- `src/features/scan/permissions/*` already demonstrates normalized platform adapter return shapes; keep that discipline when adding any store-gating state adapters/helpers.

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` (Epic 2 / Story 2.1)]
- [Source: `_bmad-output/planning-artifacts/prd.md` (FR1-FR5, offline-first constraints)]
- [Source: `_bmad-output/planning-artifacts/architecture.md` (data architecture, feature boundaries, naming conventions)]
- [Source: `_bmad-output/planning-artifacts/ux-design-specification.md` (Journey 1 store gating, `StoreRow`, CTA/empty-state guidance)]
- [Source: `_bmad-output/project-context.md` (project-specific implementation/testing rules)]
- [Source: `app/stores.tsx`]
- [Source: `app/scan.tsx`]
- [Source: `app/_layout.tsx`]
- [Source: `src/components/shell/root-stack-layout.tsx`]
- [Source: `src/components/ui/list-row.tsx`]
- [Source: `src/components/ui/button.tsx`]
- [Source: `src/components/ui/input.tsx`]
- [Source: `src/theme/tokens.ts`]
- [Source: `src/db/client.ts`]
- [Source: `src/db/bootstrap-gate.native.tsx`]
- [Source: `src/db/schema/dev-smoke.ts`]
- [Source: `drizzle/migrations.js`]
- [Source: `__tests__/story-1-4-navigation-smoke.test.js`]
- [Source: `https://docs.expo.dev/router/basics/notation/`]
- [Source: `https://docs.expo.dev/router/advanced/root-layout/`]
- [Source: `https://docs.expo.dev/router/advanced/stack/`]
- [Source: `https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/`]
- [Source: `https://orm.drizzle.team/docs/connect-expo-sqlite`]

## Completion Status

- Story 2.1 implementation and review follow-up fixes completed; status moved to `done`
- Stores persistence, repository validation, UI flows, and scan gating are implemented for Epic 2 foundation
- Validation evidence captured (targeted Story 2.1 test, full Jest regression, `typecheck`, `lint`)
- Post-review fix validation passed: targeted Story 2.1 tests, `npm run typecheck`, and `npm run lint`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Implementation Plan

- Implement `stores` SQLite/Drizzle schema + migration first, then add validated repository functions and normalized return shapes.
- Replace `app/stores.tsx` and `app/scan.tsx` placeholders with thin route wrappers over feature modules under `src/features/*`.
- Add focused Story 2.1 tests with mocked repository/router boundaries, then run validation commands and update sprint/story tracking artifacts.

### Debug Log References

- 2026-02-25: Create-story workflow executed for next backlog item discovered from `sprint-status.yaml` (`2-1-store-setup-and-active-gating`).
- 2026-02-25: Analyzed `epics.md`, `prd.md`, `architecture.md`, `ux-design-specification.md`, `project-context.md`, current repo structure, and Epic 1 retrospective/story artifacts.
- 2026-02-25: Performed official-docs web check for Expo Router, Expo SQLite, and Drizzle Expo SQLite integration to capture current guardrails while respecting pinned project versions.
- 2026-02-25: Implemented `stores` schema/repository/validation, generated Drizzle migration `0001_mature_hellcat`, and wired bundled migration export updates.
- 2026-02-25: Replaced Stores/Scan placeholder routes with feature screens for store CRUD/toggle UI and active-store scan gating.
- 2026-02-25: Added Story 2.1 behavior tests, patched navigation smoke mocks for new DB-backed routes, and fixed a pre-existing `Button` type issue blocking `tsc`.
- 2026-02-25: AI code review identified 4 issues (1 HIGH, 3 MEDIUM) across scan gate refresh behavior, submit guards, switch/row interaction conflict, and AC4 regression coverage.
- 2026-02-25: Addressed all 4 AI review findings by refreshing scan gating on screen focus, adding submit in-flight guards, isolating switch touches from row edit presses, and adding AC4 unblock-return regression coverage; revalidated targeted tests, `typecheck`, and `lint`.

### Completion Notes List

- Implemented local `stores` table schema, Zod validation, and repository functions for list/create/update/toggle/active-count with normalized UI return shapes.
- Built `src/features/stores/stores-screen.tsx` and `src/features/scan/scan-screen.tsx`; route files remain thin wrappers in `app/`.
- Stores UI supports add, inline edit, accessible active toggle switches, and validation feedback; scan route now shows calm gating CTA when no active stores and a scan-ready placeholder when active stores exist.
- Added `__tests__/story-2-1-store-setup-and-gating.test.js` covering add/edit/toggle and scan gating behavior with mocked repository/router boundaries.
- Validation results:
  - `npx jest __tests__/story-2-1-store-setup-and-gating.test.js --runInBand --watchman=false` ✅
  - `npm run typecheck` ✅ (after fixing pre-existing `src/components/ui/button.tsx` Pressable style typing issue)
  - `npm run lint` ✅
  - `npx jest --runInBand --watchman=false` ✅ (passes with non-blocking React `act(...)` warnings in navigation smoke due async route effects)
  - Post-review follow-up: `npx jest __tests__/story-2-1-store-setup-and-gating.test.js --runInBand --watchman=false` ✅
  - Post-review follow-up: `npm run typecheck` ✅
  - Post-review follow-up: `npm run lint` ✅

### File List

- `__tests__/story-1-4-navigation-smoke.test.js`
- `__tests__/story-2-1-store-setup-and-gating.test.js`
- `_bmad-output/implementation-artifacts/2-1-store-setup-and-active-gating.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `app/scan.tsx`
- `app/stores.tsx`
- `drizzle/0001_mature_hellcat.sql`
- `drizzle/meta/0001_snapshot.json`
- `drizzle/meta/_journal.json`
- `drizzle/migrations.js`
- `src/components/ui/button.tsx`
- `src/db/repositories/store-repository.ts`
- `src/db/schema/index.ts`
- `src/db/schema/stores.ts`
- `src/db/validation/stores.ts`
- `src/features/scan/scan-screen.tsx`
- `src/features/stores/stores-screen.tsx`

## Change Log

- 2026-02-25: Implemented Story 2.1 stores persistence, validated repository layer, Stores/Scan feature screens with active-store gating, and supporting tests; updated migration bundle and story/sprint tracking to `review`.
- 2026-02-25: AI code review found 4 issues (1 HIGH, 3 MEDIUM); story held pending follow-up fixes.
- 2026-02-25: Addressed all 4 AI code review findings (scan focus refresh, submit dedupe guards, switch/row interaction isolation, AC4 regression coverage), re-ran targeted Story 2.1 tests plus `typecheck`/`lint`, and moved story to `done`.

### Senior Developer Review (AI)

- Outcome: Approved
- Summary: Review findings were fixed in the follow-up cycle. `Scan` gating now refreshes on screen focus after returning from `Stores`, add/edit store actions are guarded against double-submit, switch interaction no longer competes with row edit presses, and AC4 now has regression coverage for the unblock-return flow.
- Findings:
  - None open (all reported HIGH/MEDIUM issues were addressed and revalidated).
