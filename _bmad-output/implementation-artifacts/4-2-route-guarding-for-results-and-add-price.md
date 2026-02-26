# Story 4.2: Route Guarding for Results and Add Price

Status: backlog

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want Results and Add Price to require a barcode context,
so that I never land on dead-end screens.

## Acceptance Criteria

1. **Given** I open Results without a barcode context **When** the screen loads **Then** I am redirected to Scan or shown a safe guard with a clear CTA.
2. **Given** I try to open Add Price without a store and barcode context **When** the screen loads **Then** I am redirected to Results or Scan appropriately.
3. **Given** I follow the normal Scan → Results flow **When** I reach Results or Add Price **Then** I never see a “missing barcode context” error.

## Tasks / Subtasks

- [ ] Define a reusable guard for barcode context
- [ ] Enforce guard at Results and Add Price route entry points
- [ ] Replace error-only states with safe guard + CTA or redirect
- [ ] Add tests/evidence for guarded routes

## Dev Notes

### Developer Context

- This story ensures invalid navigation paths do not produce “missing barcode context” errors.
- Guard behavior should be consistent and calm (redirect to Scan or show a clear CTA).

### Technical Requirements

- Keep guard logic out of `app/` route components by delegating to feature-level utilities.
- Normalize inputs (barcode, store context) before deciding guard behavior.
- Avoid introducing new UI patterns; reuse existing empty/guard patterns.

### Architecture Compliance

- Route files stay thin; guard logic lives in `src/features/scan/guards/*` or similar.
- Do not add platform-specific logic without `*.native.*` / `*.web.*` splits if needed.

### File Structure Requirements

- Routes: `app/results.tsx`, `app/add-price.tsx`
- Guard utilities: `src/features/scan/guards/*` (or equivalent)

### Testing Requirements

- Test: Results without barcode redirects or shows guard CTA.
- Test: Add Price without context redirects safely.
- Test: Normal Scan → Results path does not show guard error.

## References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.2)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project context rules: `_bmad-output/project-context.md`
