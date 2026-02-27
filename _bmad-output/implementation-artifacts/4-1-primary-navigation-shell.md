# Story 4.1: Primary Navigation Shell

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want consistent primary navigation (Home, Stores, Scan, Shopping),
so that the app feels structured and predictable.

## Acceptance Criteria

1. **Given** I am in the app **When** I view primary navigation **Then** I see Home, Stores, Scan, and Shopping tabs.
2. **Given** I use primary navigation **When** I navigate between tabs **Then** navigation works without exposing Results as a top-level destination.
3. **Given** Shopping is not yet implemented **When** I open the Shopping tab **Then** I see a placeholder state until Epic 3 is complete.

## Tasks / Subtasks

- [x] Build primary tab shell route group and wire existing screens into tabs (AC: 1, 2)
  - [x] Create `app/(tabs)/_layout.tsx` using Expo Router Tabs with Home, Stores, Scan, Shopping entries.
  - [x] Move top-level route entry points to tab-group files (`app/(tabs)/index.tsx`, `stores.tsx`, `scan.tsx`, `shopping-list.tsx`) or re-export existing screens from tab-group wrappers.
  - [x] Keep `results` and `add-price` outside the tab group so they are reachable only through flow navigation.
- [x] Update root stack shell to mount tab group as the primary destination (AC: 1, 2)
  - [x] In root stack layout, replace direct registration of top-level screen files with `(tabs)` as the main route.
  - [x] Retain existing protected dev route behavior for `dev/device-smoke`.
- [x] Refactor Home content to production-oriented tab home UX (AC: 1, 2)
  - [x] Remove debug launcher links to `results` and `add-price` from Home.
  - [x] Provide one clear primary CTA to Scan and secondary actions to Stores and Shopping consistent with Direction 5 (ultra-minimal).
- [x] Handle Shopping tab behavior for backward compatibility with AC3 (AC: 3)
  - [x] If Shopping feature is enabled (current state), route to full shopping list experience.
  - [x] If unavailable in a branch/regression scenario, show calm placeholder fallback instead of broken navigation.
- [x] Add and run focused tests for tab shell and route exposure (AC: 1, 2, 3)
  - [x] Assert tab presence/order and navigation behavior from root entry.
  - [x] Assert Results is not a tab destination.
  - [x] Assert Shopping tab renders expected state (implemented screen now, placeholder only if feature unavailable).

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Production router build does not define an `app-production/(tabs)` route group, so the primary tab shell is not mounted in production router mode (`app-production/_layout.tsx:1`, `src/components/shell/root-stack-layout.tsx:21`, `app-production/index.tsx:1`).
- [x] [AI-Review][HIGH] Task marked complete for tab presence/order lacks direct order assertion in Story 4.1 focused tests; current test file only validates AC3 fallback behavior (`__tests__/story-4-1-primary-navigation-shell.test.js:55`).
- [x] [AI-Review][MEDIUM] No navigation smoke coverage runs against `PRICETAG_ROUTER_ROOT=app-production`, so the production-router regression path is currently untested (`package.json:15`, `__tests__/story-1-4-navigation-smoke.test.js:220`).
- [x] [AI-Review][MEDIUM] Dev Agent File List is incomplete relative to actual git changes (`_bmad-output/implementation-artifacts/sprint-status.yaml`, `app-production/_layout.tsx`, and untracked `_bmad-output/implementation-artifacts/epic-3-retro-2026-02-27.md` are not documented).

## Dev Notes

### Story Foundation

- Epic 4 is a UX/navigation improvement epic. Story 4.1 establishes the app-level shell that frames all existing feature work.
- Current app still uses a stack-root with Home debug links for direct route jumps. This story transitions that to a production tab shell without breaking existing feature flows.

### Developer Context Section

- Existing state to preserve:
  - `app/*` route files are thin wrappers delegating to feature modules in `src/features/*`.
  - `results` and `add-price` screens already enforce context guards in-feature; keep these screens flow-driven and not tab destinations.
  - Root layout already wraps navigation in `AppTamaguiProvider` and `DatabaseBootstrapGate`; this composition must remain.
- Critical behavior target:
  - Tabs become the primary UX shell (Home/Stores/Scan/Shopping).
  - Results/Add Price remain reachable from Scan/Results flows only.
  - No regressions to existing scan->results->add/edit flows.

### Technical Requirements

- Keep route modules thin; no repository or business logic in `app/` files.
- Preserve strict typing and named export conventions in `src/` modules.
- Keep navigation-related logic in shell modules under `src/components/shell/*` where reusable.
- Ensure route moves do not break deep-link params already used by `results` and `add-price` feature screens.
- Maintain safe-area behavior and current accessibility baselines (44x44 targets, explicit labels for interactive controls).

### Architecture Compliance

- Keep `DatabaseBootstrapGate` in the root shell; do not bypass DB bootstrap before tabs/screens mount.
- Use Expo Router file-based structure with explicit tab route group and root stack composition.
- Preserve separation of concerns:
  - `app/` for route entries/layout only.
  - `src/features/*` for screen logic.
  - `src/components/shell/*` for shell/navigation composition.
- Keep Results and Add Price as guarded flow routes, not top-level app destinations.

### Library / Framework Requirements

- Keep pinned stack unchanged for this story:
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
  - `tamagui@2.0.0-rc.17`
- Prefer Expo Router JavaScript tabs for stability in this story.
- Do not adopt Expo native tabs alpha APIs as part of 4.1 unless explicitly requested.

### File Structure Requirements

- Primary files likely impacted:
  - `app/_layout.tsx`
  - `app/index.tsx` (or `app/(tabs)/index.tsx` after tab-group split)
  - New tab route-group files under `app/(tabs)/`
  - `src/components/shell/root-stack-layout.tsx`
- Keep existing flow-route files available outside tabs:
  - `app/results.tsx`
  - `app/add-price.tsx`
- Optional fallback helper reuse:
  - `src/components/shell/placeholder-screen.tsx`

### Testing Requirements

- Add navigation-shell regression tests covering:
  - Tab set visibility: Home, Stores, Scan, Shopping.
  - Results is absent from top-level tabs.
  - Route transitions between tabs are functional.
- Preserve/extend existing smoke tests where appropriate:
  - `npm run test:navigation-smoke`
- Validate quality gates after implementation:
  - `npm run lint`
  - `npm run typecheck`

### Latest Technical Information

- Expo SDK 55 release guidance confirms React Native 0.83 baseline and current Router docs flow for tab route groups.
- Expo Router docs continue recommending file-based tab route groups (`(tabs)` layout) for primary navigation shells.
- Protected route support remains available for stack/tab patterns (SDK 53+), matching current dev-route guard usage.
- Expo native tabs remain alpha/experimental; avoid introducing them in this story for baseline app shell stabilization.

### Project Context Reference

- Follow project-context rules:
  - Keep `app/` files thin and default-export route components/layouts.
  - Maintain root provider/bootstrap composition (`AppTamaguiProvider` + `DatabaseBootstrapGate`).
  - Avoid package upgrades or ecosystem churn in preview/RC stack.
  - Keep MVP local-first boundaries intact (no network/auth additions).

### References

- Epic story source: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.1)
- PRD/UX constraints:
  - `_bmad-output/planning-artifacts/prd.md`
  - `_bmad-output/planning-artifacts/ux-design-specification.md`
- Architecture and project constraints:
  - `_bmad-output/planning-artifacts/architecture.md`
  - `_bmad-output/project-context.md`
- Current navigation implementation:
  - `app/_layout.tsx`
  - `app/index.tsx`
  - `src/components/shell/root-stack-layout.tsx`

## Story Completion Status

- Status set to: done
- Completion note: Primary navigation moved to tab shell with flow routes preserved outside tabs and all validation gates passing.

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Create-story workflow executed in guided mode with user confirmations.
- Prior uncommitted workspace changes detected and explicitly preserved per user instruction.
- Dev-story workflow executed with full TDD loop: failing tests first, implementation, then full regression validation.

### Implementation Plan

- Introduce an Expo Router `(tabs)` group as primary shell and keep flow-only routes (`results`, `add-price`) in stack.
- Refactor Home route into tab-home with a Scan primary CTA and secondary Stores/Shopping actions.
- Add fallback logic in tab shopping route to render a calm placeholder if the shopping feature is disabled.
- Update app-production route mirrors to preserve production router compatibility after tab move.
- Validate via focused navigation tests plus project-wide `typecheck`, `lint`, and full Jest suite.

### Completion Notes List

- Story 4.1 selected as first `backlog` story in sprint status.
- Context synthesized from epics, PRD, architecture, UX spec, project context, current route/shell code, and current package versions.
- Existing feature-level guards for Results/Add Price verified and carried forward as implementation constraints.
- Story guidance includes migration path from stack-home debug launcher to production tab shell while preserving flow routes.
- Added `app/(tabs)` shell (`Home`, `Stores`, `Scan`, `Shopping`) and mounted it as the root stack destination.
- Kept `results` and `add-price` outside tabs, preserving flow-driven navigation boundaries.
- Reworked Home into production-oriented entry UX with one primary Scan CTA and secondary Stores/Shopping actions.
- Implemented shopping tab fallback route behavior for feature-disabled scenarios.
- Updated route mirror files in `app-production/` to align with tab-group structure.
- Added/updated tests for tab shell behavior and shopping fallback behavior.
- Fixed legacy results-related test safe-area mocks so full Jest regression suite runs green.
- ✅ Resolved review finding [HIGH]: Added `app-production/(tabs)` route group and removed legacy top-level production tab routes so production router mounts the primary tab shell.
- ✅ Resolved review finding [HIGH]: Added direct tab order assertions for Home/Stores/Scan/Shopping and explicit non-exposure of Results in Story 4.1 focused tests.
- ✅ Resolved review finding [MEDIUM]: Extended navigation smoke coverage to include production router route map and added `test:navigation-smoke:production-router` script using `PRICETAG_ROUTER_ROOT=app-production`.
- ✅ Resolved review finding [MEDIUM]: Updated story file list and change log to match current working-tree reality, including sprint-status and implementation artifact drift.

### File List

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/stores.tsx`
- `app/(tabs)/scan.tsx`
- `app/(tabs)/shopping-list.tsx`
- `src/components/shell/root-stack-layout.tsx`
- `app-production/stores.tsx` (deleted)
- `app-production/scan.tsx` (deleted)
- `app-production/shopping-list.tsx` (deleted)
- `app-production/index.tsx` (deleted)
- `app-production/(tabs)/_layout.tsx`
- `app-production/(tabs)/index.tsx`
- `app-production/(tabs)/stores.tsx`
- `app-production/(tabs)/scan.tsx`
- `app-production/(tabs)/shopping-list.tsx`
- `app-production/_layout.tsx`
- `app/index.tsx` (deleted)
- `app/stores.tsx` (deleted)
- `app/scan.tsx` (deleted)
- `app/shopping-list.tsx` (deleted)
- `__tests__/story-1-4-navigation-smoke.test.js`
- `__tests__/story-4-1-primary-navigation-shell.test.js`
- `package.json`
- `__tests__/story-2-2-price-add-edit-flow.test.js`
- `__tests__/story-2-3-results-view.test.js`
- `__tests__/story-2-7-non-blocking-flow.test.js`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `_bmad-output/implementation-artifacts/epic-3-retro-2026-02-27.md`
- `_bmad-output/implementation-artifacts/4-1-primary-navigation-shell.md`

## Change Log

- 2026-02-27: Implemented Story 4.1 primary tab navigation shell, migrated Home/Stores/Scan/Shopping into tab group, retained flow-only results/add-price routes, added shopping fallback handling, and validated with full test/lint/typecheck gates.
- 2026-02-27: Senior code review found unresolved HIGH/MEDIUM issues; story moved back to `in-progress` and AI review follow-ups added.
- 2026-02-27: Addressed code review findings - 4 items resolved (production `(tabs)` route-group parity, tab-order assertions, production-router smoke coverage, and artifact/file-list traceability updates).
- 2026-02-27: Addressed follow-up review issues by switching Shopping fallback to explicit feature-availability gating, updating focused assertions, and reconciling implementation artifact status/traceability.

## Senior Developer Review (AI)

### Reviewer

ken

### Date

2026-02-27

### Outcome

Approved

### Summary

Primary tab-shell behavior is implemented and validated for both default and production-router roots. Review follow-up items have been resolved, and artifact traceability now matches current working-tree reality.

### Findings

No open HIGH or MEDIUM findings remain.
