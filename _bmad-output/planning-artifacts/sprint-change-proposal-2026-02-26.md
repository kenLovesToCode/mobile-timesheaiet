# Sprint Change Proposal — priceTag

**Date:** 2026-02-26
**Prepared for:** sensei
**Mode:** Incremental

## 1) Issue Summary

**Problem statement:** The current Home screen exposes a plain-text route list that allows users to open flow destinations (e.g., Results) without required context. This creates a confusing, developer-looking UI and allows invalid navigation such as Results without a scanned barcode.

**Discovery context:** During Epic 2 implementation, the routing scaffolding placed debug links on Home. This resulted in “Results” being accessible without scan context and a UI that looks unfinished and dead.

**Evidence:** Home screen displays a debug route list, and Results can be opened without barcode context, producing “missing barcode context” errors.

## 2) Impact Analysis

**Epic Impact**

- **Epic 2:** Implementation complete, but UX navigation issues remain and should be resolved in a new epic.
- **Epic 3:** No change to scope; proceed next as planned.
- **Epic 4 (new):** Add to address navigation, flow guarding, and Home UX cleanup.

**Story Impact**

- No existing Epic 2 stories are modified; new Epic 4 stories added.

**Artifact Conflicts / Updates Needed**

- **PRD:** No scope changes required (UX/navigation improvements only).
- **Architecture:** Update to codify tab shell and route guards.
- **UX Design Spec:** Update navigation model, guard rules, and Home guidance.

**Technical Impact**

- Routing structure and guards to prevent invalid entry into Results/Add Price.
- Home screen UI cleanup.

## 3) Recommended Approach

**Selected path:** Option 1 — Direct Adjustment

**Rationale:** The issue is UI/UX and navigation flow, best addressed by adding a focused epic (Epic 4) without rolling back completed work or changing MVP scope. Effort is medium and risk is low.

**Effort estimate:** Medium
**Risk:** Low
**Timeline impact:** Minimal; scheduled after Epic 3.

## 4) Detailed Change Proposals

### Stories (Epic 4 additions)

**Epic 4: Navigation, Flow Guarding, and Home Experience**

**Story 4.1: Primary Navigation Shell**

OLD: Not applicable (no existing story)

NEW:

- Primary nav shows Home, Stores, Scan, Shopping tabs.
- Results is not a top-level destination.
- Shopping tab may be placeholder until Epic 3 is complete.

Rationale: Establish a clear, user-facing navigation model and remove debug routes from the Home screen.

**Story 4.2: Route Guarding for Results and Add Price**

OLD: Not applicable

NEW:

- Results requires barcode context; if missing, redirect to Scan or show a safe guard with clear CTA.
- Add Price requires store + barcode context; otherwise redirect appropriately.
- No “missing barcode context” error should appear in normal navigation.

Rationale: Prevent dead-end screens and invalid flows; align with Scan → Results flow.

**Story 4.3: Home Screen UX Cleanup**

OLD: Not applicable

NEW:

- Remove debug route list.
- Home provides primary CTA to Scan; secondary access to Stores/Shopping.
- Copy aligns with calm, minimal UX direction.

Rationale: Home should reflect the product’s core flow and not expose developer-only links.

### Architecture Updates

- Add explicit navigation shell definition (tab routes: Home/Stores/Scan/Shopping).
- Add route guard requirement for Results/Add Price.
- Place guard logic in route entry points with delegated guard utilities.

### UX Design Spec Updates

- Document navigation model with primary tabs.
- Document Results/Add Price gating behavior.
- Update Home guidance to remove debug links and align with Direction 5 (ultra-minimal).

## 5) Implementation Handoff

**Change scope:** Moderate (new epic, new navigation/guarding stories)

**Handoff recipients:**

- **UX Team:** Provide updated navigation + Home screen UX guidance and any design adjustments first.
- **Dev Team:** Implement Epic 4 stories after Epic 3.

**Success criteria:**

- Results cannot be opened without scan context.
- Add Price cannot open without store + barcode context.
- Home no longer exposes debug route list and has a clear primary Scan CTA.

---

**Status:** Draft
