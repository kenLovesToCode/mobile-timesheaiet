# Story 4.3: Home Screen UX Cleanup

Status: backlog

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

- [ ] Remove debug route list from Home
- [ ] Add primary CTA to Scan and secondary links to Stores/Shopping
- [ ] Update copy to match calm, minimal tone
- [ ] Add tests/evidence for Home content and primary CTA

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

- Route: `app/index.tsx`
- Feature UI (if needed): `src/features/home/*`

### Testing Requirements

- Test: debug route list not rendered.
- Test: primary Scan CTA and secondary links render.

## References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.3)
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project context rules: `_bmad-output/project-context.md`
