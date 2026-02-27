# Sprint Change Proposal — priceTag

**Date:** 2026-02-27
**Prepared for:** sensei
**Mode:** Batch

## 1) Issue Summary

**Problem statement:** Current navigation does not expose Product management as a first-class workflow, and users cannot directly maintain a reusable product catalog.

**Discovery context:** During Epic 4 navigation refinements and Story 2.2/2.3 usage review, product updates are currently only reachable indirectly through add/edit price flows.

**Evidence:**
- No `Products` tab exists in primary navigation.
- No dedicated product list/search screen for barcode or name.
- Product active/inactive lifecycle is not manageable in UI.

## 2) Impact Analysis

**Epic Impact**
- **Epic 4:** expanded to include Product catalog navigation and management surface.
- **Epic 2 (Stories 2.2, 2.3):** product records remain shared with Results add/edit flows and product identity display.
- **Epic 3:** Shopping List continues consuming the same product records.

**Story Impact**
- Story 4.1 acceptance updated from 4 tabs to 5 tabs.
- New Story 4.4 added: Products Catalog and Management.
- Story 2.2/2.3 behavior alignment clarified: shared product source of truth.

**Artifact Conflicts / Updates Needed**
- `epics.md`: update Story 4.1 wording + add Story 4.4.
- `sprint-status.yaml`: add story tracking for 4.4.
- Navigation + data layer code updates for Products tab and product active status.

**Technical Impact**
- Add 5th tab route and Products screen.
- Add searchable product repository APIs.
- Add `products.is_active` schema support and migration.
- Ensure Shopping/Pricing upserts reactivate shared products when reused.

## 3) Recommended Approach

**Selected path:** Option 1 — Direct Adjustment

**Rationale:** This is a contained extension of existing architecture and keeps all product consumers (Results/Shopping/Products) on one shared table.

**Effort estimate:** Medium
**Risk:** Low
**Timeline impact:** Low; additive change with focused regression tests.

## 4) Detailed Change Proposals

### Story Edits

**Story: 4.1 Primary Navigation Shell**

OLD:
- Home, Stores, Scan, Shopping tabs.

NEW:
- Home, Stores, Scan, Shopping, Products tabs.

Rationale: Product lifecycle management becomes discoverable and aligned with MVP data ownership.

**Story: 4.4 Products Catalog and Management (new)**

OLD:
- Not present.

NEW:
- Products tab with product list (name, barcode, active status).
- Search by product name or barcode.
- Add product (barcode + name).
- Edit product name.
- Set product active/inactive.
- Shared product data with Results and Shopping.

Rationale: Supports user-requested product admin needs without introducing duplicate models.

### Architecture / Data Updates

- Add `products.is_active` boolean column via migration.
- Add `product-repository` with list/search/create/edit/status APIs.
- Keep all product usage on existing `products` table.

### UI/UX Updates

- Add `Products` tab route and screen.
- Add Home secondary CTA to Products.
- Preserve existing visual/system patterns from Stores screen for consistency.

## 5) Implementation Handoff

**Change scope:** Moderate

**Handoff recipients:**
- **Development team:** implement schema, repository, navigation, and UI changes.
- **QA:** validate tab shell, product search, add/edit/inactive behavior, and shared-data consistency with Shopping/Results.

**Success criteria:**
- Primary navigation includes Products as 5th tab.
- Products screen supports list + search (name/barcode).
- Products can be added, edited, and inactivated.
- Shopping and Results continue to use the same product records.

---

**Status:** Approved and implemented
