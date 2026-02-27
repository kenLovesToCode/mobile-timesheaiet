# Story 3.3: Check Items In Cart and View List

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to check items as I add them to my cart and view my full list,
so that I can track shopping progress.

## Acceptance Criteria

1. **Given** I open the Shopping List **When** I view all items **Then** I see each item with quantity and checked status.
2. **Given** I open the Shopping List **When** the list loads **Then** it is visible within 1.0s (P95).
3. **Given** a list item exists **When** I toggle its checked state **Then** the item reflects in-cart status immediately.

## Tasks / Subtasks

- [ ] Complete Shopping List checked-state UX and semantics (AC: 1, 3)
  - [ ] Keep row-level checked state obvious and calm (`In cart` vs `Not in cart`)
  - [ ] Ensure toggle control labels are unambiguous for VoiceOver/TalkBack
  - [ ] Confirm checked/unchecked state survives reload and navigation
- [ ] Verify list-view completeness and ordering behavior (AC: 1)
  - [ ] Ensure all persisted list items render with product identity, quantity, and checked state
  - [ ] Confirm ordering is stable and intentional for in-aisle use (no surprising row jumps)
- [ ] Meet Shopping List open-time target (AC: 2)
  - [ ] Add lightweight instrumentation around Shopping List load/start render
  - [ ] Validate P95 open-to-visible <= 1.0s on representative devices
  - [ ] Apply targeted optimizations only if measurements fail threshold
- [ ] Harden error/recovery behavior for in-cart toggles (AC: 3)
  - [ ] Keep optimistic toggle updates immediate
  - [ ] Preserve rollback + inline error messaging on write failures
  - [ ] Verify rapid toggle interactions settle to the user’s final intent
- [ ] Tests + evidence capture (AC: 1, 2, 3)
  - [ ] UI tests proving list rows expose quantity + checked status for all loaded items
  - [ ] UI tests proving immediate checked-state feedback + persistence after refocus/reload
  - [ ] Performance evidence doc for Shopping List open-time P95

## Dev Notes

### Developer Context

- Story 3.2 already implemented core checked toggling and quantity controls in `ShoppingListFeatureScreen`, plus repository support via `toggleShoppingListItemChecked`.
- Story 3.3 should finish and validate the user-facing behavior as a complete shopping-progress experience: reliable checked state, clear list readability, and verified open-time performance.
- Keep the ultra-minimal direction: one-handed interactions, calm copy, no noisy state treatment.

### Story Foundation

- Epic 3 objective is a practical in-store list. By Story 3.3, users must be able to trust the list as their live progress tracker while shopping.
- PRD/NFR require Shopping List visibility within 1.0s (P95) and immediate state reflection for core list actions.

### Developer Context Section

- Existing implementation already contains:
  - Optimistic checked-state updates in `src/features/shopping-list/shopping-list-screen.tsx`
  - Serialized per-item checked writes (`checkedTargetsRef` + `flushCheckedUpdates`) to prevent race-condition desync
  - Inline rollback feedback (`shopping-list-write-error`) for write failures
- This story should avoid rewriting stable 3.2 behavior and focus on:
  - AC-level completion evidence (including performance target)
  - UX/accessibility polish for checked-state comprehension in real aisle usage
  - Regression-safe validation that list visibility and toggles remain robust

### Technical Requirements

- Preserve repository boundaries:
  - All list writes and reads go through `src/db/repositories/shopping-list-repository.ts`
  - No direct SQLite/Drizzle access in screen components
- Keep validation contract in `src/db/validation/shopping-list.ts`:
  - Barcode required
  - Quantity integer 1..`SHOPPING_LIST_QUANTITY_MAX`
  - Toggle input uses explicit boolean `isChecked`
- Maintain optimistic interaction model in Shopping List screen:
  - Immediate local UI reflection for toggle actions
  - Serialized backend writes for repeated taps
  - Rollback to saved state when writes fail
- Performance requirement is explicit for this story:
  - Capture and report measurement method + P95 evidence for list-open latency

### Architecture Compliance

- Keep `app/shopping-list.tsx` as a thin route wrapper and continue to host logic in `src/features/shopping-list/*`.
- Continue rendering behind existing app bootstrap/DB readiness patterns; do not bypass migration/bootstrap safeguards.
- Follow tokenized UI styles (`spacing`, `radii`, `touchTargets`) and existing UI primitives (`Surface`, `ListRow`, `Button`, `Text`).
- Preserve safe-area and accessibility behaviors in top-level shopping-list screen layout.

### Library / Framework Requirements

- Remain on pinned project stack (no upgrades in this story):
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
  - `tamagui@2.0.0-rc.17`
  - `drizzle-orm@^0.45.1`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`
- Use current Expo Router + Tamagui patterns already established in Epics 1-3.

### File Structure Requirements

- Primary implementation targets:
  - `src/features/shopping-list/shopping-list-screen.tsx`
  - `src/db/repositories/shopping-list-repository.ts` (only if AC/perf gaps require repository changes)
  - `src/db/validation/shopping-list.ts` (only if validation gaps are found)
- Route boundary remains:
  - `app/shopping-list.tsx` (thin wrapper only)
- Tests/evidence:
  - `__tests__/story-3-3-shopping-list-ui.test.js` (new)
  - `__tests__/story-3-3-shopping-list-performance.test.js` or equivalent measurable artifact
  - Update existing `story-3-2` tests only when reusing coverage is cleaner than duplicating

### Testing Requirements

- UI behavior coverage (AC: 1, 3):
  - Items render with quantity and checked-state label
  - Toggle interaction updates UI immediately
  - Checked state persists after reload/refocus (repository roundtrip)
- Error-path coverage:
  - Toggle write failure triggers rollback + inline error
  - Rapid repeated toggle taps resolve to final intended state
- Performance evidence (AC: 2):
  - Record method for measuring Shopping List open-to-visible time
  - Provide P95 result and device/test context in story evidence

### Previous Story Intelligence

- Story 3.2 established the exact technical base this story should extend, not replace:
  - Atomic quantity increment path with max-cap guard in repository
  - Serialized optimistic quantity + checked writes to avoid stale snapshots
  - Inline user-facing rollback error for failed writes
- Main carry-forward guidance:
  - Reuse these concurrency-safe patterns for any additional checked-state behavior
  - Avoid introducing new async state channels that bypass the serialized write queues
  - Keep constants shared (e.g., quantity max) to avoid test/validation drift

### Git Intelligence Summary

- Recent commits show Epic 3 work landing as combined story-doc and implementation batches:
  - `d5941d0` includes Story 3.1 done and Story 3.2 initial work
  - Prior commits cover Epic 4 planning and Epic 2 completion
- Implication for Story 3.3:
  - Keep changes tightly scoped to shopping-list behavior and evidence
  - Avoid mixing navigation/home-route changes from Epic 4 into this implementation

### Latest Technical Information

- Expo docs position SDK 55 as the active current SDK line and emphasize using matching package versions via Expo install flows; keep this story on the pinned SDK 55 preview stack already in repo.
- Expo Router docs continue to reinforce file-based routing with thin route modules; keep shopping-list business logic inside `src/features/*`, not in `app/` route files.
- Drizzle’s official docs still support the `expo-sqlite` adapter workflow used in this codebase; no adapter migration is required for this story.

### Project Context Reference

- Follow `_bmad-output/project-context.md` rules:
  - `app/` routes stay thin
  - strict TypeScript boundaries and named exports in `src/`
  - repository-first data access
  - no stack upgrades without explicit compatibility review
- Keep UX aligned with `_bmad-output/planning-artifacts/ux-design-specification.md` Direction 5 (ultra minimal, one clear primary action, calm interaction tone).

### References

- Epic/story source: `_bmad-output/planning-artifacts/epics.md` (Epic 3, Story 3.3)
- Sprint tracking: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Previous stories:
  - `_bmad-output/implementation-artifacts/3-2-dedupe-by-barcode-and-adjust-quantity.md`
  - `_bmad-output/implementation-artifacts/3-1-add-to-shopping-list-with-quantity.md`
- Architecture constraints: `_bmad-output/planning-artifacts/architecture.md`
- Product requirements: `_bmad-output/planning-artifacts/prd.md`
- UX constraints: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project rules: `_bmad-output/project-context.md`
- Current implementation surface:
  - `src/features/shopping-list/shopping-list-screen.tsx`
  - `src/db/repositories/shopping-list-repository.ts`
  - `src/db/validation/shopping-list.ts`
- External technical references:
  - Expo SDK docs: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/
  - Expo Router docs: https://docs.expo.dev/router/introduction/
  - Drizzle ORM docs: https://orm.drizzle.team/docs/get-started-sqlite

## Story Completion Status

- Status set to: ready-for-dev
- Completion note: Ultimate context engine analysis completed - comprehensive developer guide created.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Create-story workflow executed in automated mode.
- Validation task `_bmad/core/tasks/validate-workflow.xml` not found in repository; checklist execution skipped.

### Completion Notes List

- Story 3.3 selected automatically as first `backlog` item in sprint status.
- Context synthesized from epics, PRD, architecture, UX spec, project context, previous story artifacts, and current codebase.
- Sprint status updated from `backlog` to `ready-for-dev` for Story 3.3.

### File List

- `_bmad-output/implementation-artifacts/3-3-check-items-in-cart-and-view-list.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
