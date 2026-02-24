# Story 1.2: Local Database Setup (SQLite + Drizzle + Zod)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the local database stack configured with schema validation and migrations,
so that offline data storage is reliable and ready for feature work.

## Acceptance Criteria

1. **Given** the project dependencies are installed **When** the app starts **Then** the SQLite database initializes without errors.
2. **Given** a local schema is defined **When** the app launches **Then** versioned migrations run automatically before feature access.
3. **Given** the data layer is configured **When** I perform a basic create/read operation in dev **Then** it succeeds using Drizzle with the Expo SQLite driver.
4. **Given** entities are validated **When** invalid data is passed to the data layer **Then** Zod validation fails with a clear error.

## Tasks / Subtasks

- [x] Install database and validation dependencies using npm-first workflow:
  - [x] `expo-sqlite` (via `npx expo install expo-sqlite` to stay SDK-compatible)
  - [x] `drizzle-orm`
  - [x] `zod`
  - [x] `drizzle-kit` (dev dependency)
  - [x] Migration bundling helpers required by the chosen Drizzle Expo migration path (for example `babel-plugin-inline-import`)
- [x] Create DB folder structure aligned to architecture:
  - [x] `src/db/client.ts` (Expo SQLite + Drizzle initialization)
  - [x] `src/db/schema/` (initial schema tables for foundation/dev smoke)
  - [x] `src/db/migrations/` or generated `drizzle/` migration output (document actual choice)
  - [x] `src/db/validation/` or colocated Zod schemas for write payload validation
- [x] Add Drizzle migration configuration:
  - [x] `drizzle.config.ts` with SQLite dialect and Expo driver
  - [x] Generate initial versioned migration SQL
  - [x] Ensure migration artifacts are bundled (Babel/Metro config updates if required by approach)
- [x] Wire app-start migration execution before feature screens:
  - [x] Run migrations in app bootstrap path (`app/_layout.tsx` or a dedicated startup provider/hook)
  - [x] Gate feature rendering until migration success/error state is known
  - [x] Fail loudly with actionable debug logging if migration init fails in dev
- [x] Implement a minimal validated repository/data-layer smoke path:
  - [x] Define at least one table and matching Zod input schema (foundation entity or dedicated smoke entity)
  - [x] Add one create operation with Zod validation before DB write
  - [x] Add one read operation using Drizzle
  - [x] Demonstrate invalid payload rejection with clear error message/shape
- [x] Validation and evidence:
  - [x] Typecheck/lint/build remain green after DB stack setup
  - [x] Record the exact migration generation command and app-start migration behavior evidence in this story file
  - [x] Record files changed and any deviations from architecture naming/structure

## Dev Notes

### Developer Context

- This story establishes the local-first persistence foundation used by all later stories (stores, products, prices, recent scans, shopping list).
- The repo is currently at the app-shell foundation stage from Story 1.1 (Expo Router + Tamagui present; no DB scaffolding exists yet).
- Favor a small, correct vertical slice for DB setup over prematurely modeling every feature table in this story.

### Story Foundation

- Source story is `Epic 1 / Story 1.2` in epics.
- Business purpose: unblock all offline-first MVP flows by proving local persistence, migrations, and validation are in place early.
- This story is foundational for FR22/FR23 (offline support and persistence across restarts), even though those FRs are implemented later in feature stories.

### Technical Requirements

- Use SQLite as the on-device source of truth (offline-first, persistent across restarts).
- Use Drizzle ORM with the Expo SQLite driver (`drizzle-orm/expo-sqlite`) for typed DB access.
- Use Zod v4 for data validation at the data-layer boundary before writes (and optionally for parsing reads into app DTOs).
- Auto-run versioned migrations on app startup before feature access (AC2 is explicit; do not postpone this).
- Keep MVP local-only: no network sync, no React Query usage for this story, no backend/API calls.
- Prefer prepared/parameterized queries via Drizzle (do not introduce raw SQL string interpolation for user input).

### Architecture Compliance

- Follow architecture naming:
  - DB tables/columns in `snake_case`
  - Code identifiers in `camelCase`
  - Files in `kebab-case`
- Keep route files in `app/` thin and delegate DB concerns to `src/db/` and feature/service modules.
- Respect architecture structure target (`src/db/schema`, `src/db/migrations`, `src/db/client.ts`, `drizzle/` folder for generated artifacts).
- Treat migrations as bundled app assets; the architecture explicitly requires versioned migrations bundled in-app and run on startup.
- Keep error handling consistent with architecture direction (`AppError` normalization can start here if useful, but do not overbuild).

### Library / Framework Requirements

- Project is npm-first (`packageManager: npm@11.8.0`); do not switch back to Yarn for this story.
- Existing stack is Expo SDK 55 preview + Expo Router preview + Tamagui RC versions pinned in `package.json`; avoid dependency upgrades unrelated to DB setup.
- Use `npx expo install expo-sqlite` first to preserve Expo SDK compatibility. If Drizzle examples reference `expo-sqlite@next`, verify the resolved version still supports the required APIs (`openDatabaseSync`, migration flow) before forcing overrides.
- Drizzle Expo SQLite docs require SQLite migration SQL to be bundled and document a Babel/Metro + `drizzle.config.ts` setup; implement that pattern or a documented equivalent.
- Zod 4 is stable and the package root `zod` exports Zod 4; imports should use `import * as z from "zod"` unless there is a compelling reason otherwise.

### File Structure Requirements

- Expected new/updated areas (adjust if repo conventions evolve, but document deviations):
  - `src/db/client.ts`
  - `src/db/schema/` (e.g., `schema.ts` or split table files + index)
  - `src/db/repositories/` or `src/services/` for smoke create/read wrapper (optional but preferred over DB calls in UI)
  - `drizzle.config.ts`
  - `drizzle/` generated migrations (SQL + metadata)
  - `babel.config.js` and `metro.config.js` if migration bundling requires `.sql` handling
  - `app/_layout.tsx` (or bootstrap provider) for migration initialization/gating
- Avoid putting DB schema logic directly in route files (`app/*.tsx`).
- Keep generated files (`drizzle/`, potential generated metadata) tracked/ignored intentionally; do not let lint/build noise regress.

### Testing Requirements

- Minimum evidence for this story:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - Dev runtime evidence showing app starts and DB init/migrations complete without errors
- Add a deterministic dev smoke path for AC3/AC4 validation (can be temporary/internal):
  - Create a known record through validated input
  - Read it back through Drizzle
  - Attempt invalid input and assert/log clear Zod failure
- Prefer testable helper functions for validation + repository behavior, even if full unit tests are not added yet.

### Previous Story Intelligence

- Story 1.1 established repo conventions to preserve:
  - npm-first workflow and pinned preview/RC versions in `package.json`
  - Expo Router entry uses custom `index.js` for Tamagui/Zeego setup order
  - `app.json` already includes `scheme` (`pricetag`) and `userInterfaceStyle: automatic`
  - `npm run build` exports web + iOS + Android; keep it passing after DB config changes
- Prior review churn shows a recurring failure mode: over-claiming validation. Record only commands and runtime evidence actually executed for this story.
- `.tamagui/` and generated build artifacts were explicitly handled in lint/git ignores; avoid reintroducing generated noise when adding Drizzle artifacts.

### Git Intelligence Summary

- Recent history is mostly planning + Story 1.1 bootstrap (`story(1.1): initialize expo router app with tamagui setup`).
- Last implementation commit touched both code and BMAD artifact docs/tracker. Continue that pattern: update this story file + `sprint-status.yaml` with accurate evidence/status.
- No prior DB implementation patterns exist yet; this story defines the baseline conventions for all future data access work.

### Latest Technical Information

- Expo SDK 55 `expo-sqlite` docs list the bundled SDK-55 package line (`~55.0.8` in the current docs page) and confirm SQLite data persists across app restarts.
- Expo SQLite docs recommend `npx expo install expo-sqlite` for installation in Expo apps and document config-plugin options for native build-time SQLite features.
- Drizzle Expo SQLite docs show the Expo driver path (`drizzle-orm/expo-sqlite`) with `openDatabaseSync(...)` and document `useLiveQuery` support (optional for later stories).
- Drizzle Expo SQLite migration docs explicitly call out bundling SQL migrations in Expo/React Native apps, plus configuration for `babel.config.js`, `metro.config.js`, and `drizzle.config.ts` (`driver: "expo"`, `dialect: "sqlite"`).
- Drizzle Expo migration docs show `useMigrations` from `drizzle-orm/expo-sqlite/migrator` for app-start migration execution; this aligns with AC2.
- Zod docs confirm Zod 4 is stable, `zod@4.0.0` was published July 8, 2025, and the package root `"zod"` now exports Zod 4.
- Zod docs require/enforce TypeScript `strict` mode best practice; this repo already has `"strict": true` in `tsconfig.json`.

### Project Context Reference

- No `project-context.md` file found in the repo (`**/project-context.md` search returned none). Use `prd.md`, `architecture.md`, `epics.md`, and `ux-design-specification.md` as the authoritative planning context for this story.

### Project Structure Notes

- Current repo only has `app/` and `src/ui/`; introducing `src/db/` in this story is expected and aligned with architecture.
- If you add `metro.config.js` for Drizzle SQL bundling, ensure it does not break existing Expo/Tamagui build behavior.
- Keep any UI used for DB smoke validation minimal and removable; the story goal is stack setup, not feature UI.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/prd.md#Offline-First Data & Continuity]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md]
- [Source: _bmad-output/implementation-artifacts/1-1-base-app-initialization-and-configuration.md]
- [Source: https://docs.expo.dev/versions/v55.0.0/sdk/sqlite/]
- [Source: https://orm.drizzle.team/docs/connect-expo-sqlite]
- [Source: https://zod.dev/v4/versioning?id=versioning-in-zod-4]
- [Source: https://zod.dev/]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Dependency installs completed (npm-first): `npx expo install expo-sqlite`, `npm install drizzle-orm zod`, `npm install -D drizzle-kit babel-plugin-inline-import`
- Migration generation command executed successfully: `npx drizzle-kit generate`
- Generated migration artifact: `drizzle/0000_salty_puppet_master.sql` (+ `drizzle/migrations.js` bundle and `drizzle/meta/*`)
- Validation commands executed successfully:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Build regression encountered and fixed: web export initially failed when `expo-sqlite` was imported in shared layout; resolved with native-only `DatabaseBootstrapGate` (`src/db/bootstrap-gate.native.tsx` + `.web.tsx`)
- App-start migration behavior evidence (native runtime verified by user on iOS and Android on 2026-02-24):
  - User reported native debug status: `Migrations: success`
  - User reported native smoke status: `Smoke test: success`
  - User reported smoke result message: `create/read ok(id=dev-smoke-record), invalid rejected: Invalid dev smoke payload: label is required`
  - Native bootstrap uses `useMigrations(db, migrations)` before rendering feature stack and gates render until migration state resolves

### Implementation Plan

- Install and verify DB/validation dependencies without destabilizing the Story 1.1 baseline.
- Add Drizzle + Expo SQLite client setup and initial schema with migration generation/bundling.
- Run app-start migrations before feature access and add a minimal validated create/read smoke path.
- Capture exact validation commands and runtime evidence, then update this story record and file list.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story context created for DB foundation setup with migration and validation guardrails.
- Implemented SQLite + Drizzle + Zod foundation with `src/db/` client/schema/repository/validation modules.
- Added Drizzle Expo migration pipeline (`drizzle.config.ts`, generated `drizzle/` SQL + bundle, Babel inline SQL imports, Metro `.sql` source handling).
- Added native-only app bootstrap migration gate to keep web export green while enforcing migration success/error gating on native.
- Added dev smoke repository path for create/read and invalid Zod payload rejection logging (`runDevSmokeRepositoryDemo`).
- Deviation documented: used generated `drizzle/` output (not `src/db/migrations/`) and native/web split bootstrap gate for Expo web build compatibility.
- Native runtime verification completed on iOS and Android via temporary in-app debug panel (removed after capture).
- AI code review follow-up fixes applied (2026-02-24): dev smoke demo now cleans up its temporary record and throws if invalid payload validation is not observed; story File List corrected to match git-tracked changes.

### File List

- `app/_layout.tsx`
- `app.json`
- `babel.config.js`
- `drizzle.config.ts`
- `drizzle/0000_salty_puppet_master.sql`
- `drizzle/meta/0000_snapshot.json`
- `drizzle/meta/_journal.json`
- `drizzle/migrations.js`
- `metro.config.js`
- `package-lock.json`
- `package.json`
- `src/db/bootstrap-gate.native.tsx`
- `src/db/bootstrap-gate.web.tsx`
- `src/db/client.ts`
- `src/db/repositories/dev-smoke-repository.ts`
- `src/db/schema/dev-smoke.ts`
- `src/db/schema/index.ts`
- `src/db/validation/dev-smoke.ts`
- `src/types/sql.d.ts`
- `tsconfig.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Completion Status

- Status set to: done
- Completion note: SQLite + Drizzle + Zod DB foundation is implemented, migrations run at app startup before feature access, and native smoke validation (create/read + invalid payload rejection) was verified on iOS and Android.

## Senior Developer Review (AI)

- Date: 2026-02-24
- Outcome: Approved after fixes
- Findings fixed:
  - Prevented persistent dev smoke record pollution by using a temporary record and deleting it after verification.
  - Enforced dev smoke invalid-input rejection evidence (throws if no validation error is produced).
  - Removed false `App.tsx` entry from File List.
  - Added missing `_bmad-output/implementation-artifacts/sprint-status.yaml` entry to File List.

## Change Log

- 2026-02-24: AI code review completed; fixed review findings and moved story to `done`.
