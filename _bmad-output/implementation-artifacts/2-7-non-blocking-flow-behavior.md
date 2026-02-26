# Story 2.7: Non-Blocking Flow Behavior

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to dismiss in-progress actions without being blocked,
so that I can keep shopping.

## Acceptance Criteria

1. **Given** I start adding a price **When** I dismiss the flow without saving **Then** I can continue using the app without being blocked.
2. **Given** I leave Results or Scan mid-flow **When** I return later **Then** the app remains usable and does not force completion of a prior action.

## Tasks / Subtasks

- [x] Ensure dismiss/close actions never block the main flow (AC: 1, 2)
- [x] Guard against stale in-progress UI state on resume (AC: 2)
- [x] Tests + evidence (AC: 1–2)

### Review Follow-ups (AI)

- [x] [AI-Review][High] Add Story 2.7 test coverage for Results re-entry non-blocking behavior (AC2). [__tests__/story-2-7-non-blocking-flow.test.js]
- [x] [AI-Review][Medium] Document sprint-status.yaml change in the story File List or stop editing it as part of this story. [_bmad-output/implementation-artifacts/2-7-non-blocking-flow-behavior.md]
- [x] [AI-Review][Low] Guard recent scans loading against stale responses so failures do not clobber successful loads. [src/features/scan/scan-screen.tsx]

## Dev Notes

### Developer Context

- This story hardens the existing flow behavior so users are never forced to finish an in-progress action.
- Dismiss/close is expected to be a safe exit with no persistent blockers; unsaved data can be lost (NFR6).
- Maintain the current pattern: route screens remain thin; feature logic lives in `src/features/*`.

### Scope and Behavior

- Add/Edit Price: cancel/back should always return to Results without warnings or blocking prompts.
- Scan/Results: leaving mid-flow and returning later should not resurrect stale UI states or force completion.
- No draft persistence is required; reset local UI state on focus/blur if needed.

### UX Guardrails

- Keep the flow calm and non-blocking; no modal gates that trap the user.
- One primary CTA per screen remains intact; secondary actions are contextual.
- Avoid blamey copy; exiting mid-flow should feel normal.

### Implementation Touchpoints (Expected)

- `src/features/pricing/add-edit-price-screen.tsx` (cancel/back handling, local state reset)
- `src/features/results/results-screen.tsx` (re-entry behavior, state refresh on focus)
- `src/features/scan/scan-screen.tsx` (ensure fallback/scan state resets on blur)
- `app/add-price.tsx`, `app/results.tsx`, `app/scan.tsx` (routes should stay thin)

### Testing Notes

- Use `jest-expo` and existing Expo Router mocks.
- Focus on behavior: cancel/back returns to Results and app remains usable; no forced continuation on re-entry.

### Technical Requirements

- Cancel/back actions must always unwind to a usable screen (typically `router.back()` or `router.push('/results')` as appropriate).
- Reset local-only UI state on focus/blur so abandoned flows never re-open or block new actions.
- Do not add draft persistence; unsaved add/edit data may be lost (NFR6).
- Preserve current accessibility and touch target expectations (44x44) on all actions.

### Architecture Compliance

- Keep business logic and data access in feature modules and repositories; route files stay thin.
- Continue using adapters/repositories for device/DB work (no direct SQLite or camera API in routes).
- Keep `DatabaseBootstrapGate` behavior unchanged; DB-dependent screens must be gated.

### Library / Framework Requirements

- Do not upgrade Expo/Tamagui/Router/Drizzle versions; remain compatible with the pinned preview/RC stack.
- Use existing permission adapter and scan helpers; do not introduce new device libraries.
- If data refresh is needed on return, use existing repository calls + focus effects.

### File Structure Requirements

- `app/` routes remain composition-only.
- Feature logic stays in `src/features/*` with shared UI in `src/components/ui/*`.
- Repository usage stays in `src/db/repositories/*`.

### Testing Requirements

- Add or update Jest tests that prove cancel/back does not block the user.
- Cover re-entry behavior for Scan/Results with focus re-mount or navigation back.
- Keep tests deterministic with Expo Router and native module mocks.

### Project Structure Notes

- Follow architecture boundaries: `app/` for route shells, feature logic in `src/features/*`.
- Avoid adding business logic or permission handling directly in route files.
- Prefer existing UI primitives (`Text`, `Surface`, `Button`, `Input`, `ListRow`).

### References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.7)
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR24, NFR6, NFR7)
- Architecture: `_bmad-output/planning-artifacts/architecture.md` (project structure + flow rules)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (non-blocking flow, one-handed use)
- Project context rules: `_bmad-output/project-context.md`

## Developer Context Section

### Technical Requirements

- Ensure Add/Edit Price can be cancelled without leaving the app in a blocked state (AC1).
- Returning to Scan/Results must not show stale sheets or force completion (AC2).
- Use focus/blur effects to clear transient UI state; do not persist drafts.
- Preserve performance budgets (NFRs) by avoiding extra synchronous work on focus.

### Architecture Compliance

- Route screens in `app/` stay thin; keep logic in `src/features/*`.
- Use repositories for DB reads; no direct SQLite or Drizzle usage in screen routes.
- Maintain existing permission and scan adapters; avoid platform branching in shared files.

### Library / Framework Requirements

- Keep Expo 55 preview + Expo Router preview + Tamagui RC versions pinned.
- Use existing helpers for scan normalization and permission snapshots.
- For any barcode scanning adjustments, keep UPC/EAN-only filtering to avoid extra battery cost.
- Drizzle/SQLite usage stays behind repositories; no new drivers or migration mechanisms.

### File Structure Requirements

- `src/features/scan/scan-screen.tsx` (reset fallback state on blur)
- `src/features/results/results-screen.tsx` (refresh on focus; no forced navigation)
- `src/features/pricing/add-edit-price-screen.tsx` (cancel/back and local state reset)
- Keep `app/scan.tsx`, `app/results.tsx`, `app/add-price.tsx` thin.

### Testing Requirements

- Add a Jest test for canceling Add Price and returning to Results with UI usable.
- Add a Jest test for leaving and re-entering Scan/Results without forced continuation.
- Use existing Expo Router mocks and jest-expo environment.

## Previous Story Intelligence

- Story 2.5 implemented scan-timeout fallback + recent scans and manual entry. Reuse that fallback behavior; do not add new, separate flows.
- Story 2.6 ensured permission denied/unavailable uses the same fallback UI and prevents camera/timer mounts when blocked.
- Existing helpers:
  - `normalizeBarcodeValue` for manual entry validation.
  - Permission adapter in `src/features/scan/permissions/*`.
- Avoid reintroducing any “blocked flow” behavior in scan/permission paths.

## Git Intelligence Summary

- Recent commits established patterns for scan/permission fallback and results refresh:
  - `story(2.6) done` (permission denied/unavailable fallback parity).
  - `story(2.5) done with hotfix` (scan timeout fallback + recent scans).
  - `story(2.4) done` (scan flow with haptics and torch).
  - `story(2.3) done` (results view for active stores).
  - `story(2.2) done` (add/edit price flow).
- Follow existing conventions in `src/features/scan/*`, `src/features/results/*`, and `src/features/pricing/*`.

## Latest Technical Information

- Expo Camera barcode scanning should keep barcode types limited to what you need to reduce battery usage; keep UPC/EAN only. [External: docs.expo.dev BarCodeScanner + Camera docs]
- Expo Camera `BarcodeType` includes `upc_a`, `upc_e`, `ean13`, `ean8`; avoid enabling extra types by default. [External: docs.expo.dev Camera docs]
- Drizzle Expo SQLite guide recommends `drizzle-orm` with `expo-sqlite@next` and bundling SQL migrations in app builds; keep current pinned versions and existing inline SQL setup. [External: orm.drizzle.team Expo SQLite docs]
- Drizzle live queries (`useLiveQuery`) require `openDatabaseSync(..., { enableChangeListener: true })` and should only be used if a feature needs reactive queries. [External: orm.drizzle.team Drizzle v0.31.1 release]

## Project Context Reference

- Follow `_bmad-output/project-context.md` for strict TypeScript, adapters, route boundaries, and token usage.

## Story Completion Status

- Status set to: review
- Completion note: Non-blocking exits and re-entry behavior validated with Results/Scan coverage and stale recent scan guardrails.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-02-26: Implemented non-blocking exit routing and scan transient resets; added regression tests; full jest suite run (warnings only).
- 2026-02-26: Added Results re-entry coverage, guarded recent scans against stale responses, and documented sprint-status update.
- 2026-02-26: Cleared add/edit draft state on focus/blur, reset torch on Scan blur, and added non-blocking regression tests.

### Completion Notes List

- Implemented Results-safe exit routing for add/edit cancel/back and verifying states.
- Reset scan transient fallback/manual entry state on focus to avoid stale mid-flow UI.
- Added Story 2.7 tests and updated existing add/edit test mocks.
- Guarded recent scans loading against stale responses to avoid clobbering successful loads.
- ✅ Resolved review finding [High]: Added Results re-entry non-blocking coverage in Story 2.7 tests.
- ✅ Resolved review finding [Medium]: Documented sprint-status update in the File List.
- ✅ Resolved review finding [Low]: Prevented stale recent scan failures from overriding newer success.
- ✅ Resolved review finding [Medium]: Clear add/edit draft state on focus/blur and reset scan torch on blur.
- Added Story 2.7 regression tests for torch reset and add/edit draft clearing on re-entry.
- Tests: `npx jest __tests__/story-2-7-non-blocking-flow.test.js --runInBand --watchman=false`, `npx jest --runInBand --watchman=false` (console warnings from existing tests).
- Lint: `npm run lint`.

### File List

- src/features/pricing/add-edit-price-screen.tsx
- src/features/scan/scan-screen.tsx
- __tests__/story-2-7-non-blocking-flow.test.js
- __tests__/story-2-2-price-add-edit-flow.test.js
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-02-26: Routed add/edit cancel/back to Results when possible, reset scan transient UI on focus, added Story 2.7 tests.
- 2026-02-26: Added Results re-entry coverage, guarded recent scans against stale responses, documented sprint-status update.
- 2026-02-26: Reset add/edit draft state on focus/blur, reset scan torch on blur, and added regression tests.
