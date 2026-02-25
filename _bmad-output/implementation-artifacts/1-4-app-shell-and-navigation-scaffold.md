# Story 1.4: App Shell and Navigation Scaffold

Status: ready-for-dev

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

- [ ] Establish root navigation shell in `app/_layout.tsx` with Expo Router `Stack` and shared providers (AC: 1, 2, 3)
  - [ ] Keep `AppTamaguiProvider` and `DatabaseBootstrapGate` mounted at root layout scope
  - [ ] Configure stack-level options for consistent header behavior and route titles for placeholder screens
  - [ ] Ensure route registration does not require manual `component` wiring (Expo Router file-based mapping)
- [ ] Add placeholder route files for primary shell screens using file-based routing (AC: 1, 2)
  - [ ] Create placeholder routes for `stores`, `scan`, `results`, `add-price`, and `shopping-list`
  - [ ] Keep route components thin and delegate shared UI primitives to `src/` where needed
  - [ ] Ensure all placeholder screens render without runtime errors on iOS/Android/web
- [ ] Implement safe-area-compliant base screen scaffold for placeholder pages (AC: 3)
  - [ ] Use React Native safe-area patterns consistently so header/content spacing is correct on notched devices
  - [ ] Keep one-handed usability and tap target constraints in mind for future stories
- [ ] Wire initial navigation entry points from home placeholder without adding business logic (AC: 1, 2)
  - [ ] Provide simple links/buttons to validate route transitions among primary routes
  - [ ] Keep existing dev smoke route behavior isolated and non-disruptive
- [ ] Validate shell quality and capture implementation evidence (AC: 1, 2, 3)
  - [ ] Run `npm run typecheck`
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`
  - [ ] Record changed files, validation output summary, and any route-level caveats in `Dev Agent Record`

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

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story status is set to `ready-for-dev`.
- Story provides explicit shell-only scope boundaries to prevent premature feature implementation.
- Story includes architecture-aligned file targets and testing gates for implementation quality.
- Sprint tracking is updated to move Story 1.4 from backlog to ready-for-dev.

### File List

- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/1-4-app-shell-and-navigation-scaffold.md`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/sprint-status.yaml`

## Completion Status

- Status set to: ready-for-dev
- Completion note: Ultimate context engine analysis completed - comprehensive developer guide created.
