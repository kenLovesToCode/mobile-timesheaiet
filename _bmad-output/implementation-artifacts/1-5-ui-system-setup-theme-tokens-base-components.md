# Story 1.5: UI System Setup (Theme, Tokens, Base Components)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a consistent, calm visual system across screens,
so that the app feels trustworthy and easy to use in the aisle.

## Acceptance Criteria

1. **Given** the UI theme is configured **When** I open any primary screen **Then** colors, typography, spacing, and radii follow the defined tokens.
2. **Given** base components are implemented (Text, Button, Input, ListRow, Surface) **When** they are used in placeholder screens **Then** they render consistently across iOS and Android.
3. **Given** accessibility standards are required **When** I interact with UI elements **Then** tap targets meet 44x44 minimum and text respects Dynamic Type.

## Tasks / Subtasks

- [x] Establish the project UI token + theme foundation in Tamagui config (AC: 1)
  - [x] Replace the current default-only `tamagui.config.ts` setup with project-specific tokens for color, spacing, radius, and typography while preserving Tamagui compatibility.
  - [x] Implement light/dark theme values aligned to Grocery Green semantic colors from UX spec.
  - [x] Keep theme naming/provider usage compatible with `src/ui/tamagui-provider.tsx` (`light` / `dark`) and system color scheme switching.
- [x] Create reusable base UI primitives under `src/components/ui/` (AC: 2, 3)
  - [x] Implement `Text` wrapper with semantic variants and Dynamic Type-safe defaults.
  - [x] Implement `Button` primitive with at least primary and secondary styles, 44x44 minimum touch target, and pressed-state feedback.
  - [x] Implement `Input` primitive with consistent spacing/radius/border styling and accessible labeling hooks.
  - [x] Implement `ListRow` primitive for tappable or static row layouts with neutral/missing/secondary text treatment.
  - [x] Implement `Surface` primitive for calm card/container styling using theme tokens.
- [x] Integrate primitives into the existing shell placeholders as proof of consistency (AC: 1, 2)
  - [x] Update `app/index.tsx` and/or `src/components/shell/placeholder-screen.tsx` to use new primitives instead of ad-hoc Tamagui usage where practical.
  - [x] Preserve Story 1.4 route structure and navigation smoke behavior; do not add feature logic.
- [x] Encode accessibility guardrails into the primitives (AC: 3)
  - [x] Enforce minimum tap targets for interactive controls/rows (>=44x44).
  - [x] Avoid color-only state communication in `ListRow`/buttons.
  - [x] Ensure text components and button labels do not disable font scaling unless there is a documented reason.
- [x] Validate and document implementation evidence (AC: 1, 2, 3)
  - [x] Run `npm run typecheck`
  - [x] Run `npm run lint`
  - [x] Run `npm run build`
  - [x] Run `npm run test:navigation-smoke` (regression check for Story 1.4 shell after UI primitive adoption)
  - [x] Record only observed evidence and touched files in `Dev Agent Record`

## Dev Notes

### Developer Context

- Story 1.5 converts the current shell scaffold into a reusable UI foundation for all later feature stories in Epics 2 and 3.
- This is still a foundation story: define design-system primitives/tokens and prove them in placeholders; do not implement store/scan/results business behavior.
- The current repo already uses Tamagui, but `tamagui.config.ts` is still the stock `@tamagui/config/v3` export with no project-specific tokens. This story should close that gap without destabilizing the app shell.

### Story Foundation

- Source story: Epic 1 / Story 1.5 in planning artifacts.
- Business value: a consistent visual language improves trust and reduces UI churn before feature-heavy implementation begins.
- This story is the foundation for UX consistency requirements used throughout scan/results/add-price/list flows.

### Technical Requirements

- Keep Tamagui as the UI system of record; do not replace it with another component library.
- Implement token-driven styling (no spreading ad-hoc numeric/color literals through screen files once primitives exist).
- Preserve `AppTamaguiProvider` usage and system color scheme behavior in `src/ui/tamagui-provider.tsx`.
- Prefer additive refactors: introduce `src/components/ui/*` and update shell placeholders to consume them rather than rewriting route/layout structure.
- Keep Story 1.4 navigation shell and dev-route protections intact (`app/_layout.tsx`, `src/components/shell/root-stack-layout.tsx`, `app/dev/device-smoke.tsx`).
- No network/sync/back-end changes in this story.

### Architecture Compliance

- Follow architecture file boundaries:
  - Routes/screens remain in `app/`
  - Reusable UI primitives belong in `src/components/ui/`
  - Theme/token helpers belong in `src/theme/` (preferred) or remain in `tamagui.config.ts` if simpler for initial implementation
- Follow naming conventions from architecture:
  - Files: `kebab-case`
  - Components: `PascalCase`
  - Functions/variables: `camelCase`
- Keep feature modules untouched unless a tiny style-only integration is needed for placeholder proof.
- Avoid introducing a parallel styling system (e.g., NativeWind, StyleSheet-only design tokens) that conflicts with Tamagui theming.

### Library / Framework Requirements

- Repo is currently pinned to preview/RC stack versions (notably `expo@55.0.0-preview.12`, `expo-router@55.0.0-preview.9`, `tamagui@2.0.0-rc.17`). Do not upgrade versions in this story unless a blocker is proven and explicitly scoped.
- Use Tamagui v2-style configuration APIs (`createTamagui`, tokens/themes) and theme-aware styling (`useTheme` / token references) consistently.
- Keep Expo Router usage unchanged for this story; the work is visual-system setup, not routing changes.
- Maintain compatibility with React Native + Expo export/build scripts already used in Story 1.4 (`npm run build`, `npm run build:production-router`).

### File Structure Requirements

- Existing files likely to update:
  - `tamagui.config.ts`
  - `src/ui/tamagui-provider.tsx` (only if needed for provider/theme compatibility)
  - `app/index.tsx`
  - `src/components/shell/placeholder-screen.tsx`
  - `src/components/shell/primary-nav-link.tsx` (if migrated to new primitives/tokens)
- New files expected (exact names may vary, keep `kebab-case`):
  - `src/components/ui/text.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/input.tsx`
  - `src/components/ui/list-row.tsx`
  - `src/components/ui/surface.tsx`
- Optional theme support files (recommended if it keeps config readable):
  - `src/theme/tokens.ts`
  - `src/theme/themes.ts`
  - `src/theme/typography.ts`
- Do not move or rename route files created in Story 1.4.

### Testing Requirements

- Required quality gates:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run test:navigation-smoke` (shell regression protection after UI refactor)
- Manual/runtime sanity expectations:
  - Home + placeholder routes still render without runtime errors on iOS/Android/web
  - Light/dark theme switch follows system scheme with readable contrast
  - Base controls keep 44x44+ interactive areas and text scales with system font settings
- If automated component tests are added, keep them focused on primitive rendering/props and avoid fragile snapshots unless useful.

### Previous Story Intelligence

- Story 1.4 established a stable Expo Router shell with shared placeholder scaffolds and navigation smoke coverage; Story 1.5 should reuse those files as integration points, not replace the shell.
- Root layout/provider composition (`AppTamaguiProvider` + `DatabaseBootstrapGate`) is already stabilized and heavily reviewed. Changes here should be minimal and justified.
- Review history repeatedly flagged evidence accuracy/file-list drift. For Story 1.5, keep `Dev Agent Record` claims tightly scoped to actual changes and current-cycle validation runs.
- `PrimaryNavLink` already uses Tamagui theme values (`useTheme().borderColor`) and 44px min-height; use it as a baseline when extracting standardized button/list-row patterns.

### Git Intelligence Summary

- Recent commits are foundation-story oriented (`1.1` through `1.4`) and consistently pair implementation changes with BMAD story artifact updates.
- Story 1.4 introduced shell primitives/components (`src/components/shell/*`) and test tooling (`test:navigation-smoke`), giving Story 1.5 a clear path to add `src/components/ui/*` without changing route architecture.
- Current repository structure still lacks `src/components/ui/` and `src/theme/` implementations described by architecture/UX docs, confirming this story is the right place to add them.

### Latest Technical Information

- Expo SDK 55 reference docs align SDK 55 with React Native `0.83` and React `19.2`, which matches the current repo baseline and should be preserved while implementing this story. [Source: https://docs.expo.dev/versions/v55.0.0]
- Expo Router docs describe `app/_layout.tsx` as the root navigation/provider entry point and continue to support `Stack` route configuration used in Story 1.4, so Story 1.5 should keep UI-system integration under the existing root layout/provider flow. [Source: https://docs.expo.dev/router/advanced/root-layout/] [Source: https://docs.expo.dev/router/advanced/stack/]
- Expo Router stack docs note the newer composition API is alpha in SDK 55; avoid opportunistic routing API migrations in this UI-system story. [Source: https://docs.expo.dev/router/advanced/stack/]
- Tamagui v2 docs emphasize defining tokens/themes via `createTamagui` and using token-aware values (including `true` defaults in token scales and theme-variable access through `useTheme`). Build project tokens/themes on these patterns instead of ad-hoc styling. [Source: https://tamagui.dev/docs/core/configuration] [Source: https://tamagui.dev/docs/core/tokens] [Source: https://tamagui.dev/docs/core/use-theme]

### Project Context Reference

- No `project-context.md` file was found in the repo.
- Canonical planning/design context for this story:
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md` (Story 1.5 definition)
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md` (structure, naming, boundaries)
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md` (color/typography/spacing/accessibility targets)
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/prd.md` (NFRs, one-handed/offline usability constraints)

### Project Structure Notes

- Architecture target includes `src/components/ui/` and `src/theme/`, but the current repo has not created those directories yet; Story 1.5 should establish them incrementally.
- Current shell screens and placeholder components already prove route structure. Use them as low-risk adoption points for new primitives/tokens.
- Keep primitives generic enough for Epic 2/3 reuse, but do not overbuild feature-specific components from the UX spec yet (e.g., `StorePriceRow`, `AddPriceSheet` belong later).

### References

- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md#Visual Design Foundation]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md#UX Consistency Patterns]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md#Responsive Design & Accessibility]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/prd.md#Non-Functional Requirements]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/tamagui.config.ts]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/src/ui/tamagui-provider.tsx]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/src/components/shell/placeholder-screen.tsx]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/src/components/shell/primary-nav-link.tsx]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/app/index.tsx]
- [Source: https://docs.expo.dev/versions/v55.0.0]
- [Source: https://docs.expo.dev/router/advanced/root-layout/]
- [Source: https://docs.expo.dev/router/advanced/stack/]
- [Source: https://tamagui.dev/docs/core/configuration]
- [Source: https://tamagui.dev/docs/core/tokens]
- [Source: https://tamagui.dev/docs/core/use-theme]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-02-25: Create-story workflow executed for next backlog story auto-discovered from sprint status (`1-5-ui-system-setup-theme-tokens-base-components`).
- 2026-02-25: Analyzed epics, PRD, architecture, UX spec, previous story (`1-4`), current repo UI/Tamagui setup, and recent git history.
- 2026-02-25: Added current Expo Router / Expo SDK 55 / Tamagui technical guardrails for Story 1.5 implementation planning.
- 2026-02-25: Implemented token/theme foundation (`src/theme/*`, `tamagui.config.ts`) and UI primitives (`Text`, `Button`, `Input`, `ListRow`, `Surface`) with light/dark theme compatibility preserved in existing provider flow.
- 2026-02-25: Integrated primitives into `app/index.tsx` and shared placeholder shell component; preserved Story 1.4 route structure and verified navigation smoke tests still pass.
- 2026-02-25: Validation results observed: `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅ (`expo export` completed to `dist`), `npm run test:navigation-smoke` ✅, `npx jest --runInBand --watchman=false` ✅ (2 suites / 8 tests).
- 2026-02-25: Code review fixes applied for Story 1.5: tokenized `Input` typography, improved `ListRow` default accessibility labeling, marked placeholder proof buttons disabled, and expanded primitive tests for dark theme/token/Dynamic Type coverage.
- 2026-02-25: Review-fix validation observed: `npx jest __tests__/story-1-5-ui-primitives.test.js --runInBand --watchman=false` ✅ (1 suite / 7 tests).

### Completion Notes List

- Implemented project-specific Tamagui tokens/themes/fonts for Grocery Green light/dark semantics and kept `light`/`dark` theme naming compatible with `AppTamaguiProvider`.
- Added reusable UI primitives in `src/components/ui/` (`Text`, `Button`, `Input`, `ListRow`, `Surface`) with 44x44 touch-target guardrails, Dynamic Type defaults, and explicit missing/secondary text labels.
- Updated home and placeholder shell screens to use shared primitives and token-driven styling without changing route behavior or adding feature logic.
- Added UI primitive regression coverage (`__tests__/story-1-5-ui-primitives.test.js`) and updated Story 1.4 navigation test Tamagui mock to support the new token/theme module imports.
- Applied review-driven refinements: `Input` now uses tokenized body typography, pressable `ListRow` derives a row-level accessibility label by default, placeholder proof buttons are disabled to avoid misleading interactive affordances, and primitive tests now cover dark-theme style application plus token/Dynamic Type checks.

### File List

- __tests__/story-1-4-navigation-smoke.test.js
- __tests__/story-1-5-ui-primitives.test.js
- _bmad-output/implementation-artifacts/1-5-ui-system-setup-theme-tokens-base-components.md
- _bmad-output/implementation-artifacts/sprint-status.yaml
- app/index.tsx
- src/components/shell/placeholder-screen.tsx
- src/components/ui/button.tsx
- src/components/ui/input.tsx
- src/components/ui/list-row.tsx
- src/components/ui/surface.tsx
- src/components/ui/text.tsx
- src/theme/themes.ts
- src/theme/tokens.ts
- src/theme/typography.ts
- tamagui.config.ts

### Change Log

- 2026-02-25: Implemented Story 1.5 UI system foundation (Tamagui tokens/themes/fonts, base primitives, shell integration, and primitive tests); validations passed and story moved to `review`.
- 2026-02-25: Applied code review fixes for Story 1.5 accessibility/token/test coverage gaps and re-ran targeted primitive tests (`__tests__/story-1-5-ui-primitives.test.js`).

## Senior Developer Review (AI)

### Reviewer

ken (GPT-5 Codex)

### Review Date

2026-02-25

### Outcome

Approved after fixes (all review findings addressed in this review pass).

### Findings Summary

- High: `Input` used hardcoded typography values instead of tokenized type scale (AC1 partial).
- Medium: Placeholder proof buttons appeared interactive without actions.
- Medium: `ListRow` did not derive a row-level accessible summary label by default.
- Medium: Primitive tests did not cover dark-theme behavior or token/Dynamic Type assertions beyond `Text`.

### Fixes Applied

- Updated `src/components/ui/input.tsx` to use `typeScale.body` font size and line height.
- Updated `src/components/ui/list-row.tsx` to derive a default `accessibilityLabel` from row content for pressable rows.
- Updated `src/components/shell/placeholder-screen.tsx` to mark placeholder proof buttons as disabled demo controls.
- Expanded `__tests__/story-1-5-ui-primitives.test.js` to validate token typography usage, derived accessibility labels, dark-theme styling application, and Dynamic Type behavior for `Input`/`Button` labels.

### Validation Evidence (Review Fixes)

- `npx jest __tests__/story-1-5-ui-primitives.test.js --runInBand --watchman=false` ✅ (1 suite / 7 tests)

## Completion Status

- Status set to: done
- Completion note: Story 1.5 UI system foundation implemented, code-reviewed, and review findings fixed; story is complete.
