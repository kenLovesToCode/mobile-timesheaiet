# Story 3.1: Add to Shopping List with Quantity

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a shopper,
I want to add a scanned product to my Shopping List with a quantity,
so that I can track what I need to buy while I shop.

## Acceptance Criteria

1. **Given** I’m on Results **When** I choose Add to List **Then** the item is added with a quantity I can set at add time.
2. **Given** I add an item **When** I return to the Shopping List **Then** the item appears with the selected quantity.

## Tasks / Subtasks

- [ ] Define shopping list data contract + persistence (AC: 1, 2)
  - [ ] Add shopping list table/schema keyed by barcode with quantity + checked state
  - [ ] Add repository helpers for add/update/list and quantity handling
  - [ ] Validate inputs with Zod and normalize outputs for UI
- [ ] Add “Add to List” action from Results (AC: 1)
  - [ ] Provide a quantity picker at add time (sheet or modal)
  - [ ] Save list item locally and confirm success
  - [ ] Ensure Results refresh does not regress existing behavior
- [ ] Build Shopping List screen (AC: 2)
  - [ ] Render list items with quantity and checked state
  - [ ] Show empty state with CTA to Scan/Results
  - [ ] Respect one-handed and calm UI direction
- [ ] Tests + evidence capture (AC: 1, 2)
  - [ ] Repository tests for add/list with quantity
  - [ ] UI tests for add-to-list flow and list display

## Dev Notes

- Relevant architecture patterns and constraints
- Source tree components to touch
- Testing standards summary

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
