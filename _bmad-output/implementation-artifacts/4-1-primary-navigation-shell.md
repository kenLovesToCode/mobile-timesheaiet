# Story 4.1: Primary Navigation Shell

Status: backlog

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

- [ ] Define primary tab shell with Home/Stores/Scan/Shopping
- [ ] Remove Results from top-level navigation
- [ ] Add Shopping placeholder state (until Epic 3 is complete)
- [ ] Add tests/evidence for tab visibility and basic navigation

## Dev Notes

### Developer Context

- This story establishes the primary navigation shell and removes debug route lists.
- Results should remain a flow destination, not a tab route.
- Shopping can be a placeholder until Epic 3 is implemented.

### Technical Requirements

- Keep route entry points in `app/` thin; move logic into feature modules.
- Use existing shell/layout patterns and project tokens.
- Do not introduce new navigation libraries; stay within Expo Router.

### Architecture Compliance

- Follow `_bmad-output/project-context.md` rules for route boundaries and bootstrapping.
- Do not bypass `DatabaseBootstrapGate` for native flows.

### File Structure Requirements

- Routes: `app/` (tab shell layout)
- Shell logic: `src/components/shell/*`

### Testing Requirements

- Verify tabs render in correct order and Results is not a tab route.
- Snapshot or behavior tests for placeholder state on Shopping.

## References

- Epics: `_bmad-output/planning-artifacts/epics.md` (Epic 4, Story 4.1)
- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- UX: `_bmad-output/planning-artifacts/ux-design-specification.md`
- Project context rules: `_bmad-output/project-context.md`
