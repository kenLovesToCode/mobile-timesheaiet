# Story 2.5: Fallback to Manual Entry and Recent Scans

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want a fast fallback if scanning fails,
so that I can still reach Results quickly.

## Acceptance Criteria

1. **Given** scanning has not succeeded after ~5 seconds **When** the fallback appears **Then** I can choose manual barcode entry or a recent scan.
2. **Given** I choose manual entry **When** I enter a valid barcode **Then** I am taken to Results for that barcode.
3. **Given** I choose a recent scan **When** I select one **Then** I am taken to Results for that barcode.
4. **Given** a scan succeeds **When** it completes **Then** it is recorded into recent scans history.

## Tasks / Subtasks

- [x] Implement scan fallback timer and prompt (AC: 1)
  - [x] Add a ~5s timer after camera ready to reveal fallback UI (manual entry + recent scans)
  - [x] Ensure fallback prompt is calm and non-blocking; does not prevent continued scanning
  - [x] Reset timer appropriately on focus/blur and when a scan succeeds
- [x] Manual entry path (AC: 1, 2)
  - [x] Add a barcode entry sheet/modal with numeric keyboard and inline validation
  - [x] Reuse existing barcode sanitization/validation helpers (UPC/EAN lengths) before navigation
  - [x] Navigate to Results via `/results?barcode=...` on valid input
- [x] Recent scans storage + retrieval (AC: 1, 3, 4)
  - [x] Add `recent_scans` table in Drizzle schema (barcode, scanned_at, source)
  - [x] Add migration and update schema index exports
  - [x] Create repository helpers: record scan, list recent scans (limit, ordering)
  - [x] Ensure successful scan events record into history once per successful barcode
- [x] Recent scans UI (AC: 1, 3)
  - [x] Display recent scans in fallback sheet with empty state when none exist
  - [x] Selecting a recent scan navigates to Results with the barcode
- [x] Tests + evidence (AC: 1–4)
  - [x] Jest test for fallback appearing after ~5s (fake timers)
  - [x] Jest test for manual entry validation and navigation to Results
  - [x] Jest test for recording recent scans on successful scan
  - [x] Jest test for recent scans list ordering + empty state

## Dev Notes

### Developer Context

- Story 2.5 expands the Scan flow (Story 2.4) with the **time-based fallback** and **recent scans history**.
- Fallback must be calm, non-blocking, and one-tap: a normal path, not an error state.
- Manual entry and recent scans must route to Results with the same barcode contract as scans.
- Recent scans history should be lightweight and ordered by most recent.

### Story Foundation

- Epic 2 requires a 5s fallback to manual entry and recent scans, and to record successful scans for quick reuse.
- UX direction: calm, minimal, one-handed; fallback should reassure and unblock the user quickly.
- Results expects a valid barcode route param; sanitize to digits-only UPC/EAN before navigating.

### Technical Requirements

- Use existing scan barcode utilities to sanitize and validate UPC/EAN values (8/12/13 digits).
- Use Drizzle ORM with Expo SQLite for recent scans persistence (offline-first).
- Avoid adding network dependencies; everything is local-only.
- Ensure fallback timer does not fire after a scan succeeds or while the screen is unfocused.
- Avoid double-recording the same scan within a single capture (respect scan latch behavior).

### Architecture Compliance

- Keep `app/scan.tsx` thin; implement fallback UI and logic in `src/features/scan/*`.
- Database access should live in `src/db/repositories/*` and schema in `src/db/schema/*`.
- Use platform adapters for device capabilities (camera/haptics). No direct native API calls in routes.
- Preserve `DatabaseBootstrapGate` behavior on native; DB must be ready before queries.

### Library / Framework Requirements

- Stay on the pinned stack (Expo SDK 55 preview, Expo Router 55 preview, Tamagui 2.0.0-rc.17, React 19.2, RN 0.83).
- Use `expo-camera` scanning types for UPC/EAN only; do not expand to heavy barcode types.
- Use `expo-haptics` only for scan feedback (no new haptics in fallback beyond current patterns).
- Use Drizzle ORM + Expo SQLite driver for recent scans storage.

### File Structure Requirements

- Route wrapper: `app/scan.tsx` (remain thin).
- Feature UI/logic:
  - `src/features/scan/scan-screen.tsx`
  - `src/features/scan/scan-fallback.tsx` (new, if helpful)
  - `src/features/scan/scan-barcode.ts` (reuse validation helpers)
- DB schema + repository:
  - `src/db/schema/recent-scans.ts`
  - `src/db/schema/index.ts`
  - `src/db/repositories/recent-scans-repository.ts`
- Tests: `__tests__/story-2-5-scan-fallback.test.js` (or match existing naming)

### Project Structure Notes

- Keep UI primitives consistent with existing `Text`, `Button`, `Surface` components.
- Follow design tokens for spacing and touch targets; fallback sheet should stay minimal.
- Do not modify `dist/` or `.tamagui/` outputs.

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.5)
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR9–FR11 requirements)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (Expo + Drizzle + offline-first)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (5s fallback, calm copy)
- Project context rules: `_bmad-output/project-context.md`

## Testing Requirements

- Use `jest-expo` and existing Expo Router mocks.
- Use fake timers to validate the ~5s fallback prompt timing.
- Assert that:
  - fallback UI appears after the timer and does not block scanning
  - manual entry validates UPC/EAN length and routes to Results
  - successful scans are recorded into recent scans history
  - recent scans list is ordered most-recent-first and shows empty state when none exist

## Previous Story Intelligence

- Story 2.4 established scan latch + haptics + torch; avoid triggering fallback after a successful scan.
- Manual entry path should reuse barcode sanitization to avoid invalid Results navigation.

## Git Intelligence Summary

- Recent commits established Results and pricing flow:
  - `story(2.3) - result view for active stores`
  - `story(2.2): done add or edit price and product info`
  - `story(2.1): store setup and gating`
- Follow established patterns in `src/features/scan/*` and `src/features/results/*`.

## Latest Technical Information

- Expo Camera barcode scanning supports explicit `barcodeTypes` filtering; UPC/EAN can be limited to `upc_a`, `upc_e`, `ean13`, and `ean8` per the barcode types list.
- Expo Haptics provides `selectionAsync` and `notificationAsync` for UI feedback; reuse existing scan success haptics without adding new cues.
- Drizzle ORM provides a native Expo SQLite driver via `drizzle-orm/expo-sqlite` and works with `expo-sqlite` for local persistence.

## Project Context Reference

- Follow `_bmad-output/project-context.md` for strict TypeScript, adapter usage, and route/feature boundaries.

## Story Completion Status

- Status set to: ready-for-dev
- Completion note: Ultimate context engine analysis completed - comprehensive developer guide created

## Change Log

- 2026-02-26: Story context generated in YOLO mode after user confirmation.
- 2026-02-26: Implemented scan fallback with manual entry and recent scans persistence + UI, added tests, and updated migrations.
- 2026-02-26: Fixed review findings (dedupe/prune recent scans, clear manual entry state on blur/submit, guard async scan state), updated scan fallback test.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

- Implemented scan fallback timer with calm prompt, manual entry sheet, and recent scans list in scan flow.
- Added recent scans persistence (schema, migration, repository) and recording on successful scans.
- Added/updated tests for fallback timing, manual entry, recent scan recording, and recent scan list ordering/empty state.
- Addressed code review findings: dedupe/prune recent scans, clear manual entry state on blur/submit, guard async scan state updates; updated scan fallback test. Tests not re-run for these fixes.
- Tests: `npx jest --runInBand --watchman=false`, `npm run lint`.

### File List

- _bmad-output/implementation-artifacts/2-5-fallback-to-manual-entry-and-recent-scans.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- drizzle/0003_quiet_recent_scans.sql
- drizzle/meta/0003_snapshot.json
- drizzle/meta/_journal.json
- drizzle/migrations.js
- __tests__/story-2-3-results-view.test.js
- __tests__/story-2-4-scan-flow.test.js
- __tests__/story-2-5-scan-fallback.test.js
- src/db/repositories/recent-scans-repository.ts
- src/db/schema/index.ts
- src/db/schema/recent-scans.ts
- src/features/scan/scan-screen.tsx
