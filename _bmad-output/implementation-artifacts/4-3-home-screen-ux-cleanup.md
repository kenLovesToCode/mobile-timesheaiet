# Story 4.3: Home Screen UX Cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want a simple home screen that reflects the core flow,
so that the app feels usable and not developer-only.

## Acceptance Criteria

1. **Given** I open Home **When** I view the content **Then** the debug route list is not present.
2. **Given** I am on Home **When** I want to begin the core flow **Then** I have a primary CTA to Scan and secondary access to Stores and Shopping.
3. **Given** I read Home copy **When** I view the text **Then** it aligns with the calm, minimal UX direction.

## Tasks / Subtasks

- [x] Confirm debug route list is absent on Home (no code change needed in this story)
- [x] Confirm primary Scan CTA and secondary links to Stores/Shopping are present (no code change needed in this story)
- [x] Update copy to match calm, minimal tone
- [x] Add tests/evidence for Home content and primary CTA

## Dev Notes

### Developer Context

- Home should be a real product entry point, not a dev route hub.
- Keep the UI calm and minimal, matching the UX spec direction.

### Technical Requirements

- Use existing UI primitives and tokens; avoid ad hoc styling.
- Keep route entry point thin; move UI into feature-level components if it grows.

### Architecture Compliance

- Follow `_bmad-output/project-context.md` for route boundaries and token usage.

### File Structure Requirements

- Route: `app/(tabs)/index.tsx`
- Feature UI (if needed): `src/features/home/*`

### Testing Requirements

- Test: debug route list not rendered.
- Test: primary Scan CTA and secondary links render.

## References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.3)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project context rules: `_bmad-output/project-context.md`

## Dev Agent Record

### Agent Model Used

GPT-5 Codex

### Debug Log References

- Updated Home copy in `app/(tabs)/index.tsx` while preserving required CTA test IDs.
- Verified `app-production/(tabs)/index.tsx` still re-exports the Home implementation (no update required).
- Added Story 4.3 regression coverage in `__tests__/story-4-3-home-screen-ux-cleanup.test.js`.
- Executed: `npx jest __tests__/story-4-3-home-screen-ux-cleanup.test.js --runInBand --watchman=false`.
- Executed: `npm run test:navigation-smoke`.
- Executed: `npm run test:navigation-smoke:production-router`.
- Executed: `npm run typecheck`.
- Executed: `npm run lint`.

### Completion Notes List

- Home screen maintains product-facing content only and no debug route list content.
- Home CTA behavior verified with one primary Scan CTA and secondary Stores/Shopping CTAs.
- Home copy tightened to calm/minimal scan-first wording.
- Regression tests confirm expected CTAs and navigation paths for both router roots.

## File List

- `app/(tabs)/index.tsx`
- `__tests__/story-4-3-home-screen-ux-cleanup.test.js`
- `_bmad-output/implementation-artifacts/4-3-home-screen-ux-cleanup.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Senior Developer Review (AI)

Date: 2026-02-27
Reviewer: sensei
Outcome: Approved with fixes applied

- Fixed story over-claim by changing two completed implementation tasks into validation tasks that match actual git evidence.
- Fixed technical requirement route path to match repository structure (`app/(tabs)/index.tsx`).
- Fixed File List traceability by removing `app-production/(tabs)/index.tsx` because no git change exists for that file.
- Re-ran targeted regression test: `npx jest __tests__/story-4-3-home-screen-ux-cleanup.test.js --runInBand --watchman=false` (pass).

## Change Log

- 2026-02-27: Implemented Story 4.3 Home UX cleanup and moved status to `review`.
- 2026-02-27: Senior dev review auto-fixes applied; status moved to `done` and story evidence aligned with git changes.
