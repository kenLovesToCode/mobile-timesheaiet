# Story 1.4: App Shell and Navigation Scaffold

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a basic app shell with primary navigation in place,
so that core screens can be accessed in a consistent structure.

## Acceptance Criteria

1. **Given** the app launches **When** I view the primary navigation **Then** the core routes are present with placeholder screens.
2. **Given** navigation uses Expo Router **When** I navigate between primary routes **Then** the transitions work without errors.
3. **Given** a base layout is defined **When** I open the app **Then** the layout respects safe areas and renders consistently across iOS and Android.

## Tasks / Subtasks

- [x] Establish root navigation shell in `app/_layout.tsx` with Expo Router `Stack` and shared providers (AC: 1, 2, 3)
  - [x] Keep `AppTamaguiProvider` and `DatabaseBootstrapGate` mounted at root layout scope
  - [x] Configure stack-level options for consistent header behavior and route titles for placeholder screens
  - [x] Ensure route registration does not require manual `component` wiring (Expo Router file-based mapping)
- [x] Add placeholder route files for primary shell screens using file-based routing (AC: 1, 2)
  - [x] Create placeholder routes for `stores`, `scan`, `results`, `add-price`, and `shopping-list`
  - [x] Keep route components thin and delegate shared UI primitives to `src/` where needed
  - [x] Ensure all placeholder screens render without runtime errors on iOS/Android/web
- [x] Implement safe-area-compliant base screen scaffold for placeholder pages (AC: 3)
  - [x] Use React Native safe-area patterns consistently so header/content spacing is correct on notched devices
  - [x] Keep one-handed usability and tap target constraints in mind for future stories
- [x] Wire initial navigation entry points from home placeholder without adding business logic (AC: 1, 2)
  - [x] Provide simple links/buttons to validate route transitions among primary routes
  - [x] Keep existing dev smoke route behavior isolated and non-disruptive
- [x] Validate shell quality and capture implementation evidence (AC: 1, 2, 3)
  - [x] Run `npm run typecheck`
  - [x] Run `npm run lint`
  - [x] Run `npm run build`
  - [x] Record changed files, validation output summary, and any route-level caveats in `Dev Agent Record`

### Review Follow-ups (AI)

- [x] [AI-Review][HIGH] Wrap home route content in a safe-area-compliant scaffold so AC3 applies consistently to `index` as well as placeholder routes. [app/index.tsx:15]
- [x] [AI-Review][HIGH] Add shared `Stack` `screenOptions` for consistent stack-level header behavior (not just per-screen titles). [app/_layout.tsx:10]
- [x] [AI-Review][MEDIUM] Gate `dev/device-smoke` route registration to dev builds so it is not reachable in production via direct navigation/deep links. [app/_layout.tsx:17]
- [x] [AI-Review][HIGH] Include `top` in safe-area edges for the shared placeholder scaffold so AC3 does not depend on stack header behavior. [src/components/shell/placeholder-screen.tsx:12]
- [x] [AI-Review][MEDIUM] Conditionally register `dev/device-smoke` only in dev builds instead of relying on runtime redirect. [app/_layout.tsx:22]
- [x] [AI-Review][MEDIUM] Replace text-only navigation links on home with touch targets that satisfy 44x44 tap-area intent. [app/index.tsx:27]

## Dev Notes

### Developer Context

- Story 1.4 is a scaffold story, not a feature-complete flow story. Build route structure and placeholders only.
- Preserve current foundations from Stories 1.1-1.3: Tamagui provider setup, DB bootstrap gate, and device smoke tooling.
- Keep implementation focused on a stable shell that unblocks Epic 2 feature stories (stores, scan, results, add price, shopping list).

### Story Foundation

- Source story: Epic 1 / Story 1.4 in planning artifacts.
- Business value: fast developer iteration through stable navigation and predictable app structure before feature complexity is added.
- This story enables downstream implementation for FR1-FR32 by creating route-level entry points and shared layout constraints.

### Technical Requirements

- Use Expo Router file-based routing in `app/` as the navigation source of truth.
- Use `Stack` layout in root `app/_layout.tsx`; define `Stack.Screen` entries only when route options are needed.
- Keep route components placeholder-oriented and avoid implementing real store/scan/results/list business logic here.
- Preserve current provider composition order unless a concrete runtime issue requires change.
- Do not introduce new network, sync, or backend dependencies.

### Architecture Compliance

- Keep route files in `app/`; keep reusable logic/components in `src/`.
- Follow architecture naming conventions:
  - Files: `kebab-case`
  - Components: `PascalCase`
  - Variables/functions: `camelCase`
- Maintain feature boundaries from architecture:
  - `src/features/stores/`
  - `src/features/scan/`
  - `src/features/results/`
  - `src/features/pricing/`
  - `src/features/shopping-list/`
- Preserve Expo Router root layout as the initialization boundary for global providers.

### Library / Framework Requirements

- Keep `expo-router` as navigation framework and React Navigation native stack behavior through Expo Router.
- Continue with Tamagui as UI system; do not migrate to another component framework in this story.
- Respect current repo package manager (`npm`) and avoid unrelated dependency upgrades.
- Follow current Expo Router guidance:
  - Root layout (`app/_layout.tsx`) is app entry for shared providers/navigation.
  - Files in a route directory are auto-eligible routes; `Stack.Screen` can set options without `component` prop.
  - Starting SDK 55, options API remains valid and can coexist with composition API; use stable options API for this scaffold.

### File Structure Requirements

- Expected route files to be created/updated in this story:
  - `app/_layout.tsx`
  - `app/index.tsx`
  - `app/stores.tsx`
  - `app/scan.tsx`
  - `app/results.tsx`
  - `app/add-price.tsx`
  - `app/shopping-list.tsx`
- Optional shared placeholder UI helpers may be added under `src/components/` or feature folders if reuse is clear.
- Do not remove or break `app/dev/device-smoke.tsx`; keep it dev-only and isolated.

### Testing Requirements

- Required quality gates:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Runtime sanity expectations:
  - App launches and lands on initial route
  - Navigation to each placeholder route succeeds without runtime exceptions
  - Layout renders safely across iOS and Android safe areas
- Capture only observed validation evidence in `Dev Agent Record` during implementation.

### Previous Story Intelligence

- Story 1.3 reinforced that dev tooling/smoke routes must remain isolated from production behavior.
- Story 1.3 added camera/haptics smoke helpers with platform-specific files; avoid coupling these to new core navigation routes.
- Story 1.2 established DB bootstrap patterns and native/web safety split. Keep root provider/gate structure stable to avoid regressions.
- Prior stories emphasize accurate evidence reporting and exact file lists; keep this discipline for Story 1.4.

### Git Intelligence Summary

- Recent commits consistently bundle implementation + corresponding story artifact updates + sprint status transitions.
- Latest implemented stories touched foundational app files (`app/_layout.tsx`, `app/index.tsx`, DB/bootstrap modules); Story 1.4 should extend these carefully, not rewrite them.
- Current repo has only `index` and dev smoke routes in `app/`; adding primary placeholder routes now aligns with planned architecture.

### Latest Technical Information

- Expo Router documentation confirms root `app/_layout.tsx` is the primary initialization point for providers and root navigation.
- Expo Router stack docs (published Feb 2026) state SDK 55 supports both options-based and composition-based screen configuration; options-based API is stable for scaffold setup.
- Expo Router root-layout docs confirm route files are auto-registered in stack scope and `Stack.Screen` entries should be used for option configuration rather than component mapping.
- Expo Router notation docs (updated Aug 8, 2025) confirm `_layout.tsx` semantics and route groups behavior, useful when promoting this scaffold to tabs/groups later.
- Tamagui Expo guide confirms the template baseline remains Expo Router-first; keep this integration intact while expanding placeholders.

### Project Context Reference

- No `project-context.md` file was found. Use planning artifacts as canonical context:
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md`
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/prd.md`
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md`
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md`

### Project Structure Notes

- This story should move the repo from a single-screen placeholder to a multi-route placeholder shell while preserving existing setup work.
- If any architecture path decisions conflict with current code placement, prefer incremental alignment (create missing route files now; refactor deeper module organization in Story 1.5/epic 2 as needed).
- Keep future tab/group restructuring possible by avoiding hard-coded route assumptions in shared components.

### References

- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md#User Journey Flows]
- [Source: https://docs.expo.dev/router/advanced/stack/]
- [Source: https://docs.expo.dev/router/advanced/root-layout/]
- [Source: https://docs.expo.dev/router/basics/notation]
- [Source: https://tamagui.dev/docs/guides/expo]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-02-25: Create-story workflow executed in YOLO mode after initial template checkpoint.
- 2026-02-25: Identified next backlog item from sprint status as `1-4-app-shell-and-navigation-scaffold`.
- 2026-02-25: Loaded and analyzed epics, PRD, architecture, UX spec, prior story context (`1-3`), current repo structure, and recent git history.
- 2026-02-25: Added up-to-date Expo Router/Tamagui technical references for scaffold guardrails.
- 2026-02-25: Implemented Expo Router stack scaffold with placeholder route options and preserved root provider composition.
- 2026-02-25: Added placeholder routes (`stores`, `scan`, `results`, `add-price`, `shopping-list`) backed by shared safe-area scaffold component.
- 2026-02-25: Updated home placeholder with navigation entry links while keeping `app/dev/device-smoke.tsx` isolated and dev-only.
- 2026-02-25: Validation run completed - `npm run typecheck`, `npm run lint`, and `npm run build` all passing.
- 2026-02-25: Addressed review follow-ups in app shell and home route, then re-ran required validations successfully.

### Completion Notes List

- Added root stack options for primary routes and retained `AppTamaguiProvider` + `DatabaseBootstrapGate` at root scope.
- Added scaffold route files for `stores`, `scan`, `results`, `add-price`, and `shopping-list` with no business logic.
- Introduced `src/components/shell/placeholder-screen.tsx` with `SafeAreaView` + scroll scaffold for consistent base layout spacing.
- Updated `app/index.tsx` with primary route links for transition verification, while preserving dev-only smoke route behavior.
- Updated `tsconfig.json` to exclude `dist` so TypeScript checks ignore generated export artifacts.
- Validation evidence: `npm run typecheck` (pass), `npm run lint` (pass), `npm run build` (pass).
- Caveat: Expo build emits existing Tamagui zeego setup warning unrelated to Story 1.4 scaffold changes.
- Testing scope note: No dedicated unit/integration test harness is configured in this repo yet; validation for this scaffold story relies on required type/lint/build quality gates and route runtime sanity checks.
- ✅ Resolved review finding [HIGH]: wrapped `app/index.tsx` content in safe-area scaffold to align AC3 with placeholder routes.
- ✅ Resolved review finding [HIGH]: added shared root `Stack` `screenOptions` for consistent stack-level header behavior.
- ✅ Resolved review finding [MEDIUM]: gated `dev/device-smoke` route registration with `redirect={!__DEV__}` in root stack.
- ✅ Resolved review finding [HIGH]: added `top` safe-area edge to shared placeholder scaffold for stable cross-device spacing.
- ✅ Resolved review finding [MEDIUM]: switched `dev/device-smoke` registration to dev-only conditional stack entry.
- ✅ Resolved review finding [MEDIUM]: replaced text-only home links with 44x44+ pressable touch targets.
- Re-ran quality gates after review fixes: `npm run typecheck` (pass), `npm run lint` (pass), `npm run build` (pass).

### File List

- app/_layout.tsx
- app/index.tsx
- app/stores.tsx
- app/scan.tsx
- app/results.tsx
- app/add-price.tsx
- app/shopping-list.tsx
- src/components/shell/placeholder-screen.tsx
- tsconfig.json
- _bmad-output/implementation-artifacts/1-4-app-shell-and-navigation-scaffold.md
- _bmad-output/implementation-artifacts/sprint-status.yaml

### Change Log

- 2026-02-25: Implemented Story 1.4 app shell + primary route scaffold, added safe-area placeholder component, and passed required quality gates.
- 2026-02-25: Senior developer code review completed; 3 follow-up action items added (2 HIGH, 1 MEDIUM).
- 2026-02-25: Addressed code review findings - 3 items resolved (2 HIGH, 1 MEDIUM); quality gates passing.
- 2026-02-25: Follow-up code review found 3 additional action items (1 HIGH, 2 MEDIUM); story returned to in-progress.
- 2026-02-25: Addressed follow-up review findings - 3 items resolved (1 HIGH, 2 MEDIUM); quality gates passing; story moved to review.

### Senior Developer Review (AI)

- Outcome: Changes Requested
- Summary: Found three implementation gaps requiring follow-up before story completion.
- Findings:
  - [HIGH] Shared placeholder scaffold omits top safe-area edge, making AC3 brittle when header behavior changes.
  - [MEDIUM] `dev/device-smoke` remains registered in production stack and is only runtime-redirected.
  - [MEDIUM] Home route navigation links are text-only and do not satisfy 44x44 touch-target intent.

## Completion Status

- Status set to: review
- Completion note: All AI-review follow-up tasks are complete and validations are passing; ready for code review.
