# Sprint Change Proposal - Shopping List Redesign

Date: 2026-02-28  
Project: priceTag  
Prepared by: Codex (Correct Course workflow)

## Section 1: Issue Summary

### Trigger
The current `Shopping List` implementation (single-list, item-level check toggles, dev performance logging button) does not match the requested experience:
- Multi-list management under Shopping
- “Create new list” flow with required store selection
- Advanced Shopping editor with product search, cart management, totals, and active/done lifecycle
- Compact one-line rows optimized for tiny mobile screens

### Problem Statement
The requested behavior is a product-level change, not only a UI tweak. Current data model and screens are centered on one global list keyed by barcode, while the requested model requires multiple shopping sessions/lists scoped by store, status, and per-list cart items.

### Evidence
- Existing table is single-list by design (`shopping_list_items` keyed by `product_barcode`), with no list entity.
- Existing shopping screen includes a dev-only `Log open performance` action.
- Epic 3 stories are already completed and marked `done` in sprint status.

## Section 2: Impact Analysis

### Epic Impact
- Affected epic: **Epic 3 (In-Store Shopping List)**
- Impact level: **High functional expansion**
- Existing Epic 3 acceptance criteria do not cover:
  - multi-list index screen
  - list status lifecycle (active/done)
  - per-list edit restrictions (view-only when done)
  - advanced in-list product search/cart editing flow

### Story Impact
- Existing stories 3.1, 3.2, 3.3 become partially superseded by new behavior.
- Requested changes require new stories (or a new epic) to avoid hidden scope creep and preserve traceability.

### Artifact Conflicts
- **PRD:** Shopping List section currently describes a single list and dedupe/check flow; needs updates.
- **Epics:** Epic 3 needs extension or replacement stories.
- **Architecture:** DB schema and repository boundaries need updates for list/session entities.
- **UX Spec:** Shopping flow/wireframes need updates for new index + advanced editor + modal patterns.

### Technical Impact
- DB migration required: add shopping list header entity and list-item relationship.
- Repository/API changes: CRUD by list ID, status transitions, query filters.
- Screen flow changes: shopping index, create-list modal, advanced editor screen, edit/delete quantity modal.
- Behavior constraints: lock editing when list is done; ensure compact one-line row rendering.

## Section 3: Recommended Approach

### Recommendation
**Hybrid approach (recommended):**
1. **Direct fix now (small):** remove the `Log open performance` button from Shopping UI.
2. **New stories (main work):** implement the full Shopping redesign as explicit new backlog stories.

### Why not pure direct fix?
The requested change includes domain/data model changes and multiple new interaction flows. Doing this as ad-hoc fixes inside “done” stories will create traceability gaps and high regression risk.

### Option Evaluation
- **Option 1: Direct adjustment only:** Not viable for full scope (risk high, artifacts drift).
- **Option 2: Rollback:** Not needed.
- **Option 3: PRD MVP review:** Not required; this remains within Shopping capability but at expanded scope.
- **Selected:** **Option 1 + structured new stories (Hybrid)**

### Effort / Risk / Timeline
- Effort: **Medium-High**
- Risk: **Medium** (mainly data migration + flow complexity)
- Timeline impact: **~1 sprint** if implemented cleanly with migration + tests

## Section 4: Detailed Change Proposals

### Stories (proposed additions)

#### Story 3.4: Shopping Lists Index and Create New List
OLD:
- Single Shopping List screen with inline item controls and dev performance button.

NEW:
- Shopping tab opens `Shopping List` index screen:
  - Top CTA: `Create new list`
  - Table/list columns per row: store, date created, total amount, status (active/done)
  - Compact one-line per row rendering
- Remove dev-only `Log open performance` button from user-facing UI
- Create-list modal requires store selection

Rationale:
Introduces the new entry point and list lifecycle container required by requests 1, 2, and 8.

#### Story 3.5: Advance Shopping Screen (Active List CRUD)
OLD:
- No list-scoped advanced editing screen.

NEW:
- After create confirmation, open `Advance Shopping` screen with selected store context
- Product search scoped to selected store
- Product list (name, price) + cart section
- Tap product opens quantity modal/sheet; confirm adds to cart
- Cart rows show product name, price, quantity, amount
- Total amount shown before cart list
- Product list shows check icon for items in cart
- Tapping cart row allows quantity update or delete
- Deleting from cart removes check icon in product list
- Prominent `Save changes` action returns to Shopping index on success

Rationale:
Covers requests 2-6 with explicit AC and deterministic UX behavior.

#### Story 3.6: List Detail Reopen, Status Controls, and Read-Only Done State
OLD:
- Single global list without list-level status lifecycle.

NEW:
- Tapping list row on Shopping index opens Advance Shopping for that list
- Active list: full CRUD enabled
- Done list: read-only mode
- Ability to mark list as complete (`done`)

Rationale:
Covers request 7 and prevents accidental edits after completion.

#### Story 3.7: Data Model Migration for Multi-List Shopping
OLD:
- `shopping_list_items` keyed only by barcode (global list semantics)

NEW:
- Add `shopping_lists` table: id, store_id, status, created_at, updated_at
- Update `shopping_list_items` to include `shopping_list_id` and unique constraints per list+barcode
- Repository methods become list-scoped
- Backfill strategy for existing records to a default active list

Rationale:
This is the enabling technical story that makes 3.4-3.6 safe and maintainable.

### PRD Update
OLD (Shopping List):
- Single list with dedupe, quantity, checked state.

NEW:
- Shopping supports multiple store-scoped lists with status (active/done), advanced cart editing, totals, and read-only completed lists.

### Architecture Update
OLD:
- Single-table shopping list item model.

NEW:
- Header/detail schema for lists and list items, list-scoped repositories, migration and compatibility notes.

### UX Update
OLD:
- Basic Shopping List row interactions.

NEW:
- Shopping index + Create List modal + Advance Shopping editor with compact one-line mobile rows.

## Section 5: Implementation Handoff

### Scope Classification
**Moderate** (backlog reorganization needed)

### Handoff Recipients
- **PO/SM:** add and prioritize new stories 3.4-3.7; update sprint-status
- **Architect/Dev:** finalize schema migration and route/data boundaries
- **Dev team:** implement UI + repository + tests

### Success Criteria
- Shopping index matches requested columns and compact row behavior
- Advance Shopping flow supports search, add/update/delete cart items, and live total amount
- Save flow returns cleanly to index
- Done lists are strictly read-only
- No regression in existing shopping data persistence

---

## Checklist Status Snapshot

### 1) Understand Trigger and Context
- [x] Done: Trigger identified (Shopping redesign request)
- [x] Done: Core problem defined (single-list model mismatch)
- [x] Done: Evidence gathered (schema/screen/sprint status)

### 2) Epic Impact Assessment
- [x] Done: Current epic impact assessed (Epic 3)
- [x] Done: Epic-level changes defined (new stories needed)
- [x] Done: Future impact reviewed (limited to shopping domain)
- [x] Done: Need for new stories confirmed
- [x] Done: Priority/sequence adjustment identified

### 3) Artifact Conflict Analysis
- [x] Done: PRD conflict identified
- [x] Done: Architecture conflict identified
- [x] Done: UX spec conflict identified
- [x] Done: Secondary artifact impact identified (tests, sprint status)

### 4) Path Forward Evaluation
- [x] Viable: Direct adjustment for small immediate fix (remove dev button)
- [N/A] Not viable as sole solution: Rollback
- [N/A] Not required: MVP scope reduction
- [x] Done: Hybrid recommendation selected

### 5) Proposal Components
- [x] Done: Issue summary
- [x] Done: Impact and artifact adjustments
- [x] Done: Recommended path with rationale
- [x] Done: MVP impact and action plan
- [x] Done: Handoff plan

### 6) Final Review and Handoff
- [x] Done: Proposal compiled
- [x] Done: Accuracy check completed
- [x] Done: User approval received (`yes`, 2026-02-28)
- [x] Done: sprint-status updated with new approved backlog stories (3.4-3.7)
- [x] Done: execution handoff prepared

## Approval and Routing Record

- Approval date: 2026-02-28
- Approved by: sensei
- Scope classification: Moderate
- Route to: Product Owner / Scrum Master for backlog sequencing, then Development for implementation
- Immediate action: remove `Log open performance` button in Shopping UI as first direct fix
