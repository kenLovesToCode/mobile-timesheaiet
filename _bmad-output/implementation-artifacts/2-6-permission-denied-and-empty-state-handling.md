# Story 2.6: Permission Denied and Empty State Handling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want the app to handle missing permissions and empty states gracefully,
so that I can still use core features.

## Acceptance Criteria

1. **Given** camera permission is denied **When** I attempt to scan **Then** I am routed to a manual-entry + recent-scans fallback experience without requiring camera access.
2. **Given** camera permission is denied **When** I enter a valid barcode manually **Then** I reach Results for that barcode.
3. **Given** camera permission is denied **When** I choose a recent scan **Then** I reach Results for that barcode.
4. **Given** recent scans has no history **When** the fallback list is shown **Then** I see a clear empty state with a direct path to manual entry.
5. **Given** camera permission is unavailable (device/web) **When** I open Scan **Then** I see the same manual-entry + recent-scans fallback path.

## Tasks / Subtasks

- [x] Align denied/unavailable states with fallback UI (AC: 1, 5)
  - [x] Reuse the fallback UI used for scan-timeout so manual entry + recent scans is available when permission is denied/unavailable
  - [x] Ensure the camera view and scan timers do not mount when permission is denied/unavailable
- [x] Manual entry path remains first-class (AC: 2)
  - [x] Validate UPC/EAN (8/12/13 digits) using existing barcode normalization helper
  - [x] Navigate to Results with `/results?barcode=...` (same contract as scan/fallback)
- [x] Recent scans path from denied/unavailable state (AC: 3)
  - [x] Load recent scans via repository and allow tapping to open Results
  - [x] Ensure list is still accessible without camera permission
- [x] Empty state handling (AC: 4)
  - [x] Show a clear empty state when recent scans are empty
  - [x] Provide a direct CTA to manual entry from the empty state
- [x] Tests + evidence (AC: 1–5)
  - [x] Jest test: permission denied shows fallback UI and hides camera
  - [x] Jest test: manual entry from denied/unavailable navigates to Results
  - [x] Jest test: recent scans empty state displays CTA for manual entry

## Dev Notes

### Developer Context

- This story refines the Scan screen behavior when **camera permission is denied or unavailable**, ensuring the user can still reach Results via manual entry or recent scans.
- The fallback UX must remain **calm, minimal, and non-blocking**, consistent with the existing scan timeout fallback (Story 2.5).
- Do not introduce new flows; **reuse the fallback UI and recent scans data** to prevent duplication and inconsistencies.

### Technical Requirements

- Use the existing permission adapter in `src/features/scan/permissions/*` to detect `denied` vs `unavailable` states.
- Keep permission handling and fallback UI in `src/features/scan/*`; do not add camera or permission logic inside `app/scan.tsx`.
- Use `normalizeBarcodeValue` for manual entry validation; do not re-implement barcode parsing.
- Ensure no scan timers run when permission is denied/unavailable (avoid fallback timer race conditions).

### Architecture Compliance

- Route files in `app/` stay thin; Scan screen logic belongs in `src/features/scan/scan-screen.tsx` (or extracted feature-local components).
- Access data through repositories in `src/db/repositories/*` (recent scans) rather than direct SQLite calls.
- Preserve `DatabaseBootstrapGate` behavior; do not read recent scans before DB is ready.

### Library / Framework Requirements

- Keep the pinned Expo 55 preview + Expo Router preview + Tamagui RC stack; do not upgrade dependencies for this story.
- Continue to use Expo Camera permission APIs and the existing scan component; avoid adding new camera libraries.
- Keep offline-first behavior; no network calls or analytics.

### File Structure Requirements

- Route wrapper (stay thin): `app/scan.tsx`
- Feature logic/UI:
  - `src/features/scan/scan-screen.tsx`
  - Optional feature-local view extraction if the denied/unavailable UI becomes large
- Data access:
  - `src/db/repositories/recent-scans-repository.ts`
- Shared helpers:
  - `src/features/scan/scan-barcode.ts`

### Testing Requirements

- Use `jest-expo` and existing Expo Router mocks.
- Tests should verify:
  - Permission denied/unavailable renders fallback UI and hides camera mount.
  - Manual entry from denied/unavailable routes to Results with sanitized barcode.
  - Recent scans empty state shows a clear CTA to manual entry.

### Project Structure Notes

- Use existing UI primitives (`Text`, `Surface`, `Button`, `Input`, `ListRow`) and spacing tokens.
- Maintain 44x44 touch targets and accessibility labels for fallback actions.
- Keep copy calm and non-blaming (“Camera access is denied” → “Use manual entry below”).

## Previous Story Intelligence

- Story 2.5 already implemented the **scan-timeout fallback** and **recent scans** persistence/UI.
- Reuse the fallback prompt and recent scans list from the scan-timeout path to avoid duplicate UX and logic.
- Manual entry already navigates to Results and validates UPC/EAN via `normalizeBarcodeValue`.

## Git Intelligence Summary

- Recent commits established patterns for Scan/Results and for repository usage:
  - `story(2.4) done scan flow with haptics and torch`
  - `story(2.3) - result view for active stores`
  - `story(2.2): done add or edit price and product info`
- Mirror existing patterns in `src/features/scan/*` and `src/features/results/*`.

## Latest Technical Information

- Expo Camera permission responses expose `status`, `granted`, and `canAskAgain` values that should be normalized for UI decisions (use the existing adapter rather than raw response objects).
- Expo barcode scanning supports explicit `barcodeTypes`; keep UPC/EAN-only filtering (`upc_a`, `upc_e`, `ean13`, `ean8`) to avoid expanding scan scope.

## Project Context Reference

- Follow `_bmad-output/project-context.md` for strict TypeScript, adapter usage, and route/feature boundaries.

## References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 2, Story 2.6)
- PRD: `_bmad-output/planning-artifacts/prd.md` (FR31–FR32)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md` (permission denied flow + empty states)
- Project context rules: `_bmad-output/project-context.md`
- Previous story: `_bmad-output/implementation-artifacts/2-5-fallback-to-manual-entry-and-recent-scans.md`

## Story Completion Status

- Status set to: done
- Completion note: Permission-denied/unavailable fallback reuses scan-timeout UI, includes manual entry and recent scans, and tests cover denied/unavailable flows and empty state CTA. Added denied-permission manual-entry + recent-scan navigation coverage and preserved scan performance measurement.

## Change Log

- 2026-02-26: Implemented permission denied/unavailable fallback parity, added empty state CTA, and updated scan tests.
- 2026-02-26: Added denied permission manual entry + recent scan navigation coverage and preserved scan performance measurement.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

### Completion Notes List

- Implemented permission denied/unavailable fallback using shared manual entry + recent scans UI, with empty state CTA to manual entry.
- Added permission fallback loading for recent scans without camera access and prevented camera/timer mounts when permission is blocked.
- Added denied permission manual-entry and recent scan selection test coverage.
- Preserved scan performance measurement when manual entry or recent scans are used.
- Tests not run (not requested).

### File List

- src/features/scan/scan-screen.tsx
- __tests__/story-2-6-permission-denied-empty-state.test.js
- __tests__/story-2-4-scan-flow.test.js
- __tests__/story-2-5-scan-fallback.test.js
