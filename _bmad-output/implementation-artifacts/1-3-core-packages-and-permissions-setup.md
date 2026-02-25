# Story 1.3: Core Packages and Permissions Setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want core device packages and permissions configured,
so that scanning, torch, and haptics are ready for feature implementation.

## Acceptance Criteria

1. **Given** the app targets iOS and Android **When** I install required packages for camera scanning, torch, and haptics **Then** the project builds without dependency conflicts.
2. **Given** the app needs camera access **When** I run the app on a device **Then** the camera permission prompt is configured correctly.
3. **Given** torch and haptics will be used **When** the app runs on device **Then** the required platform permissions/entitlements are present and no runtime permission errors occur.

## Tasks / Subtasks

- [x] Install and verify the core device packages using Expo-compatible installs (AC: 1)
  - [x] Install `expo-camera` via `npx expo install expo-camera` (do not manually pin an incompatible version)
  - [x] Install `expo-haptics` via `npx expo install expo-haptics`
  - [x] Confirm `npm run typecheck`, `npm run lint`, and `npm run build` still pass after package installation
  - [x] Record the exact installed versions resolved by Expo in this story file
- [x] Configure native permissions in Expo app config for camera usage (AC: 2, 3)
  - [x] Add/configure the `expo-camera` config plugin in `app.json` `expo.plugins`
  - [x] Set a user-facing iOS `cameraPermission` message appropriate for price scanning
  - [x] Ensure `recordAudioAndroid` is explicitly disabled (`false`) since MVP scanning does not record video/audio
  - [x] Preserve existing `expo-router` and `expo-sqlite` plugin entries and current app config values (`scheme`, `userInterfaceStyle`, etc.)
- [x] Add a minimal device-permission utility/smoke path (AC: 2, 3)
  - [x] Create a small reusable camera permission helper/hook module (for later Scan feature work) using `expo-camera` permission APIs
  - [x] Add a temporary or dev-only smoke path to request/check camera permission on device without implementing the full scan UI yet
  - [x] Verify the permission request does not regress web export/build (avoid forcing camera-only code in shared bootstrap paths)
- [x] Validate torch and haptics readiness without overbuilding the scan feature (AC: 3)
  - [x] Add a small dev smoke action that exercises `expo-haptics` (success/selection feedback) and logs/handles failures cleanly
  - [x] Confirm no extra manual Android permission config is required for haptics (`VIBRATE` is auto-added by `expo-haptics`)
  - [x] Document that torch is provided by `expo-camera` (`CameraView` / camera props) and will be functionally exercised in Story 2.4 scan UI implementation
  - [x] Capture device runtime evidence showing no permission runtime errors during camera permission request and haptics invocation on iOS and Android (user-attested is acceptable in this environment if direct runtime artifacts cannot be produced)
- [x] Document implementation guardrails and file impacts for later stories (AC: 1, 2, 3)
  - [x] Record package install commands, app config/plugin changes, and runtime evidence in `Dev Agent Record`
  - [x] Record files changed and any deviations from architecture structure/naming expectations
  - [x] Update this story file and `_bmad-output/implementation-artifacts/sprint-status.yaml` accurately after completion

### Review Follow-ups (AI)

- [x] [AI-Review][High] Add missing changed file `index.ts` to Dev Agent Record File List so file-impact documentation matches git reality. [`/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/1-3-core-packages-and-permissions-setup.md:207`]
- [x] [AI-Review][Medium] Prevent `/dev/device-smoke` diagnostics route from being accessible in production builds (route-level guard or dev-only route strategy). [`/Users/kenlovestocode/Desktop/Me/ai/pricetag/app/dev/device-smoke.tsx:23`]
- [x] [AI-Review][Medium] Change web haptics smoke fallback to report unsupported/non-success so web runs cannot be mistaken for native haptics validation. [`/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/device/haptics/dev-haptics-smoke.web.ts:1`]
- [x] [AI-Review][Low] Disable or explicitly label camera permission actions as unsupported on web in the smoke UI to reduce false-positive validation interpretation. [`/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/scan/permissions/camera-permission.web.ts:17`]

## Dev Notes

### Developer Context

- This story prepares device capabilities for later feature work (scan UI, torch toggle, haptics feedback) without implementing the full scan flow yet.
- Stories 1.1 and 1.2 already established an Expo Router + Tamagui app shell and native-only DB bootstrap gate. Preserve those foundations and avoid introducing regressions in multi-platform exports.
- The goal is configuration correctness and runtime permission readiness, not a polished scanner experience (that arrives in Epic 2, especially Story 2.4 and Story 2.6).

### Story Foundation

- Source story is `Epic 1 / Story 1.3` in `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md`.
- Business purpose: de-risk device integration early so scan/torch/haptics implementation in Epic 2 is blocked only by feature UI/flow work, not dependency or permission setup.
- This story directly supports later FR6, FR7, FR8, and FR31 by establishing package compatibility and permission plumbing.

### Technical Requirements

- Use `expo-camera` for camera access, barcode scanning callbacks, and torch support (do not use deprecated `expo-barcode-scanner` for new work).
- Use `expo-haptics` for touch feedback (scan success feedback will be implemented in Story 2.4).
- Install Expo-managed native modules with `npx expo install ...` so versions match the project’s Expo SDK line.
- Keep MVP local-only: no network/API additions, no React Query introduction, no backend integration.
- Do not implement full scan screen business logic in this story; keep any runtime verification path minimal and removable or reusable as shared permission utility code.

### Architecture Compliance

- Continue to keep route files in `app/` thin and delegate reusable logic into `src/` modules (for example, `src/features/scan/permissions/` or a shared permission hook/util path).
- Preserve file naming conventions from architecture and prior stories:
  - Files: `kebab-case`
  - Functions/variables: `camelCase`
  - Components: `PascalCase`
- Preserve existing startup boundaries:
  - `app/_layout.tsx` should remain focused on providers/bootstrap (`AppTamaguiProvider`, `DatabaseBootstrapGate`, router stack)
  - Avoid importing device-only scan modules into the app root until the actual scan route exists
- Maintain Expo Router file-based routing and current app config structure (`app.json`, `index.js` custom entry, `scheme` already set to `pricetag`).

### Library / Framework Requirements

- Repo is npm-first (`packageManager: npm@11.8.0`). Use npm / `npx expo install`, not Yarn.
- Current stack includes Expo SDK 55 preview (`expo: 55.0.0-preview.12`) and pinned Tamagui RC packages. Avoid unrelated dependency upgrades in this story.
- `expo-camera` latest Expo docs show:
  - Install via `npx expo install expo-camera`
  - `CameraView` supports barcode scanning via `onBarcodeScanned` and torch via `enableTorch`
  - Config plugin supports `cameraPermission` (iOS) and `recordAudioAndroid`
- `expo-haptics` latest Expo docs show:
  - Install via `npx expo install expo-haptics`
  - Android `VIBRATE` permission is added automatically
  - `performAndroidHapticsAsync` is preferred for Android-native haptics semantics when appropriate
- Important runtime caveat for future scan story planning: Expo Haptics docs note iOS haptics can be no-op when the iOS Camera is active; account for this in acceptance evidence for scan feedback (avoid treating silent haptics as an automatic failure if no error occurs).

### File Structure Requirements

- Expected changed files for this story (likely):
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/package.json`
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/package-lock.json`
  - `/Users/kenlovestocode/Desktop/Me/ai/pricetag/app.json`
  - Optional small reusable permission/runtime-smoke helper under `src/features/scan/` or `src/features/device/` (preferred), or a clearly scoped temporary dev file documented for later cleanup
  - Optional minimal dev-only route/screen in `app/` (if used for runtime validation); keep it isolated and non-blocking
- Avoid touching DB migration/bootstrap files from Story 1.2 unless required for import-safety/build regressions.
- Do not add full Results/Scan/List screens yet; keep feature scope narrow to package + permission setup.

### Testing Requirements

- Minimum validation commands after package/config changes:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
- Device runtime evidence expected for this story (user-attested is acceptable in this environment):
  - iOS and Android camera permission request path opens without runtime errors
  - Permission prompt text is correctly configured on iOS
  - Haptics call executes without runtime exception on iOS and Android (physical vibration/taptic behavior may vary by platform/device state)
- Keep runtime smoke verification simple and explicit. Record only evidence actually observed/executed.

### Previous Story Intelligence

- Story 1.2 established a recurring guardrail: avoid over-claiming validation. This story should record exact commands and user-attested runtime evidence precisely.
- Story 1.2 introduced `DatabaseBootstrapGate` with native/web split files to keep web export green. Do not regress this by importing device-only modules into shared root bootstrapping.
- Story 1.1/1.2 both emphasize preserving current Expo preview + Tamagui RC version pins and minimizing unrelated upgrades; follow the same discipline here.
- Existing `app.json` already includes `plugins` (`expo-router`, `expo-sqlite`) and app `scheme` (`pricetag`). Camera plugin changes must merge cleanly with these entries rather than replacing them.
- Native export logs may still show the known non-fatal `@tamagui/native/setup-zeego` warning during `npm run build`; do not misattribute that warning to camera/haptics package setup.

### Git Intelligence Summary

- Recent commits show a stable pattern of:
  - implementing the feature/config change,
  - updating the corresponding BMAD story artifact,
  - updating `_bmad-output/implementation-artifacts/sprint-status.yaml`.
- Story 1.2 commit (`449ce48`) touched `app.json`, `package.json`, `package-lock.json`, and DB/bootstrap modules. Story 1.3 will likely touch `app.json` and package files again, so be careful not to overwrite Story 1.2 settings.
- No scan feature modules exist yet in the current tracked structure (`app/_layout.tsx`, `app/index.tsx`, `src/db/*`, `src/ui/*`). This story should establish the first scan/permission utility surface in a way that matches the architecture target (`src/features/scan/`).

### Latest Technical Information

- Expo Camera docs (latest as of 2026-02-24) list bundled `expo-camera` version `~17.0.10`, installation via `npx expo install expo-camera`, and config plugin support for `cameraPermission` / `recordAudioAndroid`. `CameraView` supports `onBarcodeScanned` and `enableTorch` for barcode scanning and torch control.
- Expo Camera docs explicitly note only one camera preview should be active at a time; future scan screens should unmount camera when unfocused (important for Expo Router navigation).
- Expo Haptics docs (latest as of 2026-02-24) list bundled `expo-haptics` version `~15.0.8`, installation via `npx expo install expo-haptics`, and automatic Android `VIBRATE` permission handling.
- Expo Haptics docs also note iOS haptics may do nothing when the iOS Camera is active; scan success feedback implementation should treat this as a platform behavior caveat and handle it gracefully.
- Expo Haptics docs recommend `performAndroidHapticsAsync` over raw vibrator-style haptics for Android when appropriate.
- Implementation inference for this repo: because the project is on an Expo 55 preview line, the exact installed versions may differ from latest docs. Use `npx expo install` and record the resolved versions instead of forcing the docs-listed bundled versions.

### Project Context Reference

- No `project-context.md` file found in the repo (`**/project-context.md` search returned none). Use `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/prd.md`, `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md`, `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md`, and `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md` as authoritative planning context.

### Project Structure Notes

- Current codebase is still foundation-stage and does not yet include `src/features/scan/` or scan routes. Introducing a small `src/features/scan/permissions` helper in this story is aligned with the architecture’s feature-based structure and reduces future duplication.
- Keep scan runtime smoke paths isolated so Story 2.4 can replace them cleanly with the full camera-first UI.
- If a temporary dev route is added, document whether it should be removed in Story 2.4 or retained as an internal device capability smoke screen.

### References

- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Core Architectural Decisions]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Project Structure & Boundaries]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/prd.md#Scanning & Barcode Input]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/prd.md#Basic Error/Empty States]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/planning-artifacts/ux-design-specification.md#Experience Principles]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/1-1-base-app-initialization-and-configuration.md]
- [Source: /Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/1-2-local-database-setup-sqlite-drizzle-zod.md]
- [Source: https://docs.expo.dev/versions/latest/sdk/camera/]
- [Source: https://docs.expo.dev/versions/latest/sdk/haptics/]

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- 2026-02-24: Create-story workflow generated comprehensive implementation context for Story 1.3 from epics/architecture/PRD/UX plus current repo state and recent git history.
- 2026-02-24: Story marked `ready-for-dev` in sprint tracking; implementation work has not started yet.
- 2026-02-24: Updated sprint tracking and story status to `in-progress` for Story 1.3 before implementation.
- 2026-02-24: Ran `npx expo install expo-camera` and `npx expo install expo-haptics`; Expo SDK 55 preview resolved both packages to `~55.0.7`.
- 2026-02-24: Added `expo-camera` config plugin in `app.json` with iOS `cameraPermission` copy for barcode scanning and `recordAudioAndroid: false`.
- 2026-02-24: Added platform-safe camera permission helper and dev smoke route (`/dev/device-smoke`) plus dev-only link from `app/index.tsx`.
- 2026-02-24: Validation results - `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅ (expected non-fatal Tamagui `setup-zeego` warning persists during export).
- 2026-02-24: Device runtime evidence (iOS/Android permission prompt + haptics execution) not captured in this environment; requires physical device/emulator run or user attestation.
- 2026-02-24: User-attested runtime evidence captured for iOS and Android on `/dev/device-smoke`: camera permission prompt shown on both platforms, iOS prompt copy confirmed correct, haptics smoke returned success on both platforms (`selection+notification` on iOS, `selection+android` on Android), and no runtime permission/haptics errors reported.
- 2026-02-24: User also reported DB dev-smoke logs from Story 1.2 (`[db] Dev smoke create/read succeeded` and invalid-payload rejection) while testing; treated as expected unrelated smoke logging, not a Story 1.3 regression.
- 2026-02-24: Review follow-up fix pass: added production route guard for `/dev/device-smoke`, changed web haptics smoke fallback to explicit unsupported/non-success, and labeled/disabled camera permission smoke actions on web.
- 2026-02-24: Re-ran validations after review fixes: `npm run typecheck` ✅, `npm run lint` ✅, `npm run build` ✅ (same known non-fatal Tamagui `setup-zeego` warning during export).

### Implementation Plan

- Install `expo-camera` and `expo-haptics` with Expo-managed version resolution. ✅ (`~55.0.7` / `~55.0.7`)
- Add `expo-camera` config plugin permissions in `app.json` without regressing existing `expo-router` and `expo-sqlite` plugin configuration. ✅
- Add a minimal reusable permission helper and runtime smoke path for camera permission + haptics verification. ✅
- Run validation commands and record exact runtime evidence/versions before moving the story forward. ✅ (CLI validations complete; user-attested device runtime evidence recorded)

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created.
- Story context created for core device package + permission setup with Expo Camera / Haptics guardrails and platform caveats.
- Installed Expo-managed device packages: `expo-camera@~55.0.7` and `expo-haptics@~55.0.7` (resolved by `npx expo install` for Expo SDK 55 preview).
- Updated `app.json` plugins to include `expo-camera` with `cameraPermission` message ("Allow PriceTag to use your camera to scan product barcodes.") and `recordAudioAndroid: false` while preserving `expo-router` + `expo-sqlite`.
- Added reusable camera permission helper modules under `src/features/scan/permissions/` with `.native`/`.web` platform splits to avoid web export regressions.
- Added reusable dev haptics smoke helper modules under `src/features/device/haptics/` with `.native`/`.web` platform splits (native path logs/returns failures cleanly).
- Added temporary dev smoke route `app/dev/device-smoke.tsx` and a `__DEV__` home link to exercise camera permission check/request and haptics smoke without scan UI implementation.
- `npm run typecheck`, `npm run lint`, and `npm run build` all passed after changes; `npm run build` still shows the previously-known non-fatal Tamagui `setup-zeego` warning.
- Torch support is documented in the dev smoke screen note as part of `expo-camera` and deferred for functional exercise in Story 2.4 scan UI implementation.
- Expo Haptics Android permission note confirmed via story technical guidance/docs: no extra manual Android permission config added because `VIBRATE` is auto-managed by `expo-haptics`.
- Story was held `in-progress` until device runtime evidence (iOS + Android camera permission prompt and haptics invocation) or user attestation was captured.
- User-attested device runtime evidence now closes the remaining Story 1.3 acceptance gap for camera permission/haptics readiness on iOS and Android.
- ✅ Resolved review finding [High]: Confirmed `index.ts` is included in Dev Agent Record File List so file-impact documentation matches changed files.
- ✅ Resolved review finding [Medium]: Added a route-level production guard in `app/dev/device-smoke.tsx` to redirect non-dev builds away from `/dev/device-smoke`.
- ✅ Resolved review finding [Medium]: Updated web haptics smoke fallback to return an explicit unsupported/non-success result to avoid false-positive validation interpretation.
- ✅ Resolved review finding [Low]: Disabled and clearly labeled camera permission smoke actions as web-unsupported in the device smoke UI.

### File List

- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/1-3-core-packages-and-permissions-setup.md`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/implementation-artifacts/sprint-status.yaml`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/app.json`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/app/index.tsx`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/app/dev/device-smoke.tsx`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/package.json`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/package-lock.json`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/index.ts`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/device/haptics/dev-haptics-smoke.native.ts`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/device/haptics/dev-haptics-smoke.web.ts`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/scan/permissions/camera-permission.native.ts`
- `/Users/kenlovestocode/Desktop/Me/ai/pricetag/src/features/scan/permissions/camera-permission.web.ts`

## Senior Developer Review (AI)

### Review Date

- 2026-02-24

### Outcome

- Approved (Re-review)

### Findings Summary

- Re-review found no remaining code or documentation issues in the Story 1.3 implementation scope.
- Previous review findings (file-list completeness, production route guard, web haptics unsupported reporting, web camera smoke labeling/disablement) were verified as resolved.
- Git vs story File List now matches the actual changed implementation files.
- Validation spot-check re-run passed: `npm run typecheck`, `npm run lint`, and `npm run build` (with the same previously-known non-fatal Tamagui warning during export).

### Recommended Action

- Mark Story 1.3 as `done` and continue with the next planned story.

## Change Log

- 2026-02-24: Implemented Story 1.3 package/config scaffolding and dev smoke path for camera permission + haptics; pending device runtime evidence before moving to review.
- 2026-02-24: Recorded user-attested iOS/Android runtime evidence from `/dev/device-smoke` and moved Story 1.3 to review.
- 2026-02-24: Senior Developer Review (AI) requested changes; added 4 review follow-up action items and returned story to `in-progress`.
- 2026-02-24: Addressed code review findings - 4 items resolved (Date: 2026-02-24); reran typecheck/lint/build and returned story to review.
- 2026-02-24: Re-review approved - all prior findings verified fixed, validations rechecked, and story moved to done.

## Completion Status

- Status set to: done
- Completion note: Re-review approved with no remaining findings; prior review follow-ups verified fixed, validation commands rechecked, and Story 1.3 is complete.
