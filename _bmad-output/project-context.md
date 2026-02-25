---
project_name: 'priceTag'
user_name: 'ken'
date: '2026-02-25T19:58:42Z'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
existing_patterns_found: 14
status: 'complete'
rule_count: 56
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

- Package manager: `npm@11.8.0` (agents should not switch package managers without explicit instruction)
- Expo stack is on preview releases:
  - `expo@55.0.0-preview.12`
  - `expo-router@55.0.0-preview.9`
  - `react-native@0.83.2`
  - `react@19.2.0`
- UI stack:
  - `tamagui@2.0.0-rc.17` and matching `@tamagui/*` packages at `2.0.0-rc.17`
- Data/local persistence:
  - `drizzle-orm@^0.45.1`
  - `drizzle-kit@^0.31.9`
  - `expo-sqlite@~55.0.8`
  - `zod@^4.3.6`
- Testing/tooling:
  - `jest@~29.7.0`, `jest-expo@~55.0.9`, `@testing-library/react-native@^13.3.3`
  - `typescript@~5.9.2`, `eslint@^9.39.3`, `eslint-config-expo@~55.0.0`
- Version discipline rule: because Expo Router, Expo SDK, and Tamagui are on preview/RC versions, agents must not upgrade or add adjacent ecosystem packages without checking compatibility with the pinned Expo 55 preview stack.

## Critical Implementation Rules

### Language-Specific Rules

- TypeScript runs in `strict` mode. Agents must avoid `any` and preserve explicit types for component props, async return values, and repository/API boundaries.
- Respect platform resolution configured in `tsconfig.json` (`moduleSuffixes: [".native", ".web", ""]`):
  - Prefer `*.native.*` / `*.web.*` file splits for platform differences (camera permissions, haptics, DB bootstrap behavior) instead of large runtime `Platform.OS` branches.
- Use `import type` for type-only imports to match existing style and reduce runtime import noise.
- Expo Router rule: files under `app/` should default-export route components/layouts.
- Shared source rule: modules under `src/` should prefer named exports for utilities, components, and adapters unless framework conventions require default exports.
- Normalize platform/library responses into project-specific shapes before returning them (example pattern: permission snapshots), so UI/features do not depend on raw Expo response objects.
- Async error handling rule: log dev/debug failures with scoped prefixes (for example `[db]`) and provide explicit fallback UI in app bootstrap flows instead of failing silently.
- Preserve literal/union-friendly types in cross-platform adapters (e.g., web stubs should match native contract shape exactly, including sentinel values like `isAvailable: false`).

### Framework-Specific Rules

- Expo Router structure:
  - Keep `app/` route files thin (screen entry points only); move reusable layout/shell logic into `src/components/shell/*` or feature modules.
  - Route/layout files in `app/` must default-export the route component.
- Root shell composition rule:
  - Global providers and bootstrapping belong in the root shell/layout (`AppTamaguiProvider`, `DatabaseBootstrapGate`, router stack config), not repeated in individual routes.
- DB bootstrap rule:
  - Native app flows must render behind `DatabaseBootstrapGate` so Drizzle migrations complete before feature screens rely on SQLite.
  - Web bootstrap gate remains a pass-through unless web DB initialization requirements are explicitly introduced.
- Cross-platform framework rule:
  - For device/capability features (camera, haptics, DB bootstrap), use platform-specific adapter files (`*.native.*`, `*.web.*`) with matching exports.
- React hooks rule:
  - Use hooks only inside function components/custom hooks, and keep effects scoped to lifecycle/side-effect work (bootstrap, logging, async initialization).
  - Guard dev-only side effects and routes with `__DEV__`.
- Tamagui/theme rule:
  - Use project theme/tokens (`src/theme/tokens`) and existing UI primitives before introducing ad hoc styles/components.
  - Keep design constants (spacing, radii, touch targets, typography) centralized in theme/token modules.
- React Native UI rule:
  - Preserve safe-area handling explicitly on top-level screens.
  - Maintain accessibility basics already present (button roles, labels, 44x44 minimum touch targets).
- Feature boundary rule:
  - Prefer wrappers/adapters/repositories (e.g., permissions helpers, DB client/repositories) over direct Expo/SQLite API usage in route components.

### Testing Rules

- Use `jest-expo` test environment and keep tests compatible with the current Jest config (`jest.config.js`, `jest.setup.js`).
- Prefer behavior-focused tests over implementation-detail assertions:
  - For routes/shells, test navigation, visible text, guards, and rendered outcomes.
  - For UI primitives, test public props/contracts and accessibility behavior.
- Mock framework/native boundaries aggressively in tests (Expo Router internals, safe-area context, Tamagui provider/theme, native device APIs) so tests remain deterministic.
- When route/module behavior depends on `__DEV__`, isolate module loading (`jest.isolateModules`) and test both dev and non-dev branches.
- Preserve regression assertions for cross-platform shell contracts when relevant (for example safe-area edges, redirect behavior, route guard behavior).
- Test naming convention: use descriptive story/behavior names that map to implementation artifacts (current pattern: `story-<epic>-<story>-...`).
- Keep `dist/` and generated output excluded from tests; do not add tests that depend on exported build artifacts.
- For platform adapters/repositories, test normalized return shapes and error handling boundaries rather than raw third-party library internals.

### Code Quality & Style Rules

- Follow existing naming conventions exactly:
  - Files/routes/modules: `kebab-case`
  - Components/types: `PascalCase`
  - Functions/variables: `camelCase`
  - Platform-specific modules: `*.native.*` / `*.web.*`
- Respect project structure boundaries:
  - `app/` = Expo Router route entry points
  - `src/components/ui/*` = reusable UI primitives
  - `src/components/shell/*` = app shell/navigation composition
  - `src/theme/*` = tokens/themes/typography constants
  - `src/db/*` = database client/schema/bootstrap/repositories
  - `src/features/*` = feature-specific logic/adapters
- Prefer existing UI primitives (`Text`, `Surface`, `Button`, etc.) before creating duplicate components or styling directly in route screens.
- Prefer theme/token values (`spacing`, `radii`, `touchTargets`, theme colors) over ad hoc hardcoded design values; if a new reusable design value is needed, add it to theme/token modules first.
- Keep comments minimal and purposeful; use clear names/types instead of explanatory noise.
- Keep route files focused on screen composition and navigation wiring; move reusable logic or complex UI into `src/` modules.
- Maintain lint compatibility with Expo flat config and existing ignore patterns (`dist`, `.tamagui`); do not introduce generated artifacts into lint/test scope.
- When editing existing files, preserve local formatting/style patterns if no formatter config is present.

### Development Workflow Rules

- Follow BMAD artifact workflow when implementing stories:
  - Keep story/retro/evidence documents in `_bmad-output/implementation-artifacts/` aligned with implementation progress.
  - Respect tracked status transitions in `_bmad-output/implementation-artifacts/sprint-status.yaml` (especially `in-progress` -> `review` -> `done`).
- Validate changes with relevant local scripts before considering work complete (choose the smallest set that matches the change):
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:navigation-smoke`
  - `npm run check:expo-config`
- Use targeted validation rather than full build/export for every change; run export/build scripts only when the change affects packaging/router/export behavior.
- Branch naming rule for agent-created branches: use `codex/*` prefix.
- Keep commits scoped to a single story/fix/theme of change; avoid mixing unrelated artifact edits and code changes when possible.
- When implementation changes behavior, update corresponding BMAD evidence/story artifacts in `_bmad-output/implementation-artifacts/` to preserve traceability.
- Do not modify generated output folders (`dist/`, `.tamagui/`) unless the task explicitly requires generated artifacts.
- Prefer file-based documentation of acceptance evidence (tests, runtime notes, screenshots references) in the existing BMAD artifact structure.

### Critical Don't-Miss Rules

- Do not import native-only device APIs directly into shared or web-facing modules when a platform adapter/wrapper already exists (camera permissions, haptics, DB bootstrap behaviors).
- Do not bypass `DatabaseBootstrapGate` for native app flows that depend on SQLite/Drizzle state; migrations must complete before DB-dependent UI runs.
- Do not place complex business logic, data access, or platform API calls directly in `app/` route files; keep route files as composition/navigation entry points.
- Do not hardcode reusable design values (spacing, radii, touch target sizes, typography scales, theme colors) outside theme/token modules unless it is truly one-off and justified.
- Do not modify coordinated Expo config plumbing casually:
  - `app.config.js` router plugin root override (`PRICETAG_ROUTER_ROOT`)
  - Babel `.sql` inline import support
  - Metro `.sql` resolver configuration
  - Changes in one of these often require matching changes in the others.
- Preserve `__DEV__` guard behavior:
  - Dev-only routes/features must be hidden or redirected safely in non-dev mode.
  - Test both branches when touching guarded code.
- Web unsupported-capability behavior should return normalized unsupported snapshots (stable contract) instead of leaking platform exceptions to UI code.
- Native bootstrap/migration failures must present explicit fallback UI and console diagnostics; avoid silent failures or blank screens.
- MVP privacy boundary: do not introduce network sync, analytics, auth, or remote telemetry without explicit product direction (current app is local-only).
- Keep bootstrap/dev smoke side effects idempotent and guarded (avoid repeated initialization work on re-render).

---

## Usage Guidelines

**For AI Agents:**

- Read this file before implementing any code.
- Follow all rules exactly as documented.
- When in doubt, prefer the more restrictive option.
- Update this file if new project-specific patterns emerge.

**For Humans:**

- Keep this file lean and focused on non-obvious agent guidance.
- Update it when the technology stack or implementation patterns change.
- Review periodically and remove rules that become redundant.

Last Updated: 2026-02-25T19:58:42Z
