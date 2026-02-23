---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - docs/MVP_SPEC.md
  - _bmad-output/brainstorming/brainstorming-session-2026-02-23_17-21-14Z.md
workflowType: 'prd'
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 1
classification:
  projectType: mobile_app
  domain: general
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document - priceTag

**Author:** ken
**Date:** 2026-02-23T19:06:05Z

## Executive Summary

Price Tag is an offline-first mobile app for grocery shoppers who need fast, accurate, store-specific item prices while they’re in the aisle. Many stores don’t display prices on items; the current workaround is asking employees or walking to a dedicated scanner area, which adds friction and slows down shopping.

The MVP solves this by letting users scan a 1D barcode (UPC/EAN) and immediately see known prices across their preselected “active stores,” including when each price was last captured. When a price is missing, the app makes contribution a first-class action: one tap from the results screen opens an add-price flow that saves locally and updates the results instantly—no network required.

The product wins on speed and reliability in real store conditions (one-handed use, curved packaging, glare) through scan guidance (angle coach) and a fast fallback path (manual barcode entry + recent scans). It is optimized for making quick “where should I shop?” decisions and building a simple shopping list as you go.

### What Makes This Special

- **In-aisle price certainty:** replaces “ask an employee / walk to scanner” with an instant answer on-device.
- **Fast + accurate by design:** scan-first flow with explicit guardrails for common failure modes (curvature/glare) and a low-friction fallback.
- **Store-specific truth:** prices are captured and displayed in a store context (not generic/averaged), enabling real decisions about where to buy.
- **Offline-first utility:** lookup, add/update price, and list actions work in airplane mode; results update immediately.
- **Missing data is actionable:** “Missing” is never a dead end—adding a price is the primary growth mechanic.

## Project Classification

- **Project Type:** mobile_app
- **Domain:** general (consumer grocery/retail)
- **Complexity:** low
- **Project Context:** greenfield

## Success Criteria

### User Success

- **In-aisle answer replaces scanner area:** User can scan an item and get a store-specific price answer without asking employees or walking to a store scanner area.
- **Speed (happy path):** From opening Scan → Results shown in **< 3 seconds** on a successful scan.
- **Fallback timing:** If no reliable scan within **5 seconds**, the UI offers a clear one-tap fallback (manual barcode entry + recent scans).
- **Reliability in real conditions:** **95%** scan success rate in typical grocery conditions (curved packaging + glare) within the 5-second window (measured on target devices).
- **Contribution doesn’t block shopping:** When price/product is missing, the user can start adding it immediately after scanning, and can **dismiss/close and continue shopping** without being blocked (unsaved input may be lost).
- **One-handed flow:** Scan → Results → (Add Price / Add to List) is usable one-handed with minimal taps.

### Business Success

- **Primary success (personal):** The app is “worth using” for you/your family on real trips (repeat usage).
- **Secondary success (trusted circle):** You can share it with a few other people you know and it remains simple and reliable (no onboarding burden, no account required in MVP).
- **Publish readiness (future):** If you decide to publish, the product can evolve toward a centralized data model (sync) without breaking the core workflow.

### Technical Success

- **Offline-first is real:** In airplane mode, the app supports: scan, local lookup, results display, add/update price, add to list, list management.
- **Instant local updates:** Adding/editing a price updates Results immediately (no spinners waiting on network).
- **Data durability:** Prices, stores, products, recent scans, and list items persist reliably across app restarts.
- **Graceful failure:** Camera permission denial, scan failure, or missing data always has a clear next action (no dead ends).

### Measurable Outcomes

- **P95 scan→results time:** < 3s (successful scans).
- **Fallback prompt time:** 5s.
- **Scan success rate:** 95% (within 5s) in typical grocery conditions.
- **Offline coverage:** 100% of core MVP flows usable in airplane mode.
- **User completion:** A user can complete a full “scan → results → (optional add price) → add to list” loop without getting stuck.

## Product Scope

### MVP - Minimum Viable Product

- Active stores setup (must select ≥1 active store before scanning).
- 1D barcode scanning (UPC/EAN) with angle coach guidance.
- Results screen showing all active stores with **price + captured timestamp** or **Missing**.
- One-tap add price per store from Results (works offline; updates instantly).
- Manual barcode entry + recent scans fallback (prompted after 5s).
- Single Shopping List (dedupe by barcode; quantity; checked = in cart).

### Growth Features (Post-MVP)

- Centralized sync (optional), multi-device, multi-user sharing.
- Conflict rules + poisoning/abuse mitigation.
- Price history and “stale” policy (threshold + badges).
- Unit pricing / variant handling for fair comparisons.
- Better “low confidence” confirmation step to prevent wrong-but-confident errors.

### Vision (Future)

- Store integrations / APIs where possible.
- Receipt import / automated capture.
- Smart shopping plans (cheapest across stores vs single-store trip).
- Richer product metadata (name/size) and better matching rules.

## User Journeys

### Journey 1 — Primary User (You) “Instant price in-aisle” (happy path)

You’re shopping at **Abreeza** and pick up an item with no visible shelf tag. You don’t want to hunt for a scanner area or ask an employee, so you open Price Tag and go straight to **Scan** (you’ve already set active stores like **Gaisano Citygate, Abreeza, NCCC Choice Mart, Gaisano Mall (Bajada)**).

You scan the barcode and land on **Results** in under 3 seconds. The Results screen shows each active store row with either a price + timestamp or **Missing**. You’re currently in Abreeza, so you tap the Abreeza row (Missing) and immediately add:
- product name
- price
- barcode (auto from the scan)

You save, return to Results, and the Abreeza row updates instantly (offline). You tap **Add to List**, set quantity (e.g., 2) right there, and continue shopping—confident you captured the price without leaving the aisle.

### Journey 2 — Primary User (You) “Scan fails → fallback still wins” (edge case)

You’re shopping at **NCCC Choice Mart** and the barcode is on curved, shiny packaging. You try scanning but it doesn’t lock quickly. At **5 seconds**, the app prompts a fast fallback: **manual barcode entry** (and/or pick from **recent scans**).

You choose manual entry, type the barcode, and proceed to Results. There’s no price yet, so you add the **product name + price** for the store you’re in. Halfway through entering details, you need to move on—so you **close/dismiss** the add flow and keep shopping. Later, you can rescan or re-enter and save (the app never blocks you from continuing the trip).

### Journey 3 — Family Member “Use the list while shopping”

A family member opens the app to use the **Shopping List** during a trip. They don’t necessarily scan items; instead they use the list as the guide. Each item shows quantity, and they check items as they put them in the cart (checked = “in cart”).

If they accidentally add the same item again (same barcode), the list **increments quantity** rather than creating a duplicate. The list stays simple and fast—no accounts or complicated setup—so it’s useful even for someone who didn’t create the prices.

### Journey 4 — Admin/Ops (You) “Set up and maintain stores + data”

Before (or during) a trip, you manage your active stores list: add stores (e.g., **Gaisano Citygate**), fix names, and toggle which stores are active so Results stays relevant. When you notice a wrong price or outdated entry, you edit it so the next scan shows correct, store-specific info with an updated timestamp.

Because the MVP is personal/offline-first, this “admin” work is lightweight: quick toggles, quick edits, and everything remains local on the device.

### Journey Requirements Summary

These journeys imply the MVP must support:
- Active store management (add/edit/toggle active; block scanning until ≥1 active store)
- Scan → Results in **<3s** on success; fallback offered at **5s**
- Results view: active stores with price+timestamp or Missing
- From Results: add missing data as **product name + price + barcode**
- Offline-first persistence with instant UI updates after save
- Shopping List: add with quantity, dedupe by barcode, **increment quantity**, checked=in-cart
- “Don’t block the trip”: user can close/dismiss flows and continue shopping (unsaved input may be lost)

## Mobile App Specific Requirements

### Project-Type Overview

- Built as a **cross-platform mobile app** using **Expo + React Native**.
- Primary usage is **in-store**, optimized for **one-handed** interaction and fast scan→results flow.

### Technical Architecture Considerations

- Default architecture is **local-first**: core entities (stores, products, prices, recent scans, shopping list) persist on-device and power all offline flows.
- UI state must be resilient to interruption (user can dismiss and resume without losing essential context).

### Platform Requirements (`platform_reqs`)

- Support iOS + Android via Expo/React Native.
- Personal build for now (no immediate App Store / Play Store release constraints beyond basic permission correctness).

### Device Permissions & Features (`device_permissions`)

- **Camera** permission required for barcode scanning.
- **Flashlight/torch** support during scanning (UX toggle).
- **Haptics** for scan feedback (success + possibly error/timeout cues).

### Offline Mode (`offline_mode`)

- Entire MVP is **local-only** (no accounts, no sync).
- Offline must cover: scan, lookup, results, add product name + price + barcode, add to list, list edits.

### Push Strategy (`push_strategy`)

- **No push notifications** in MVP.

### Store Compliance (`store_compliance`)

- MVP targets **personal builds**; defer store submission requirements until a later “publish/sync” phase.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP (nail scan→results speed, reliability, and one-handed flow; make “missing” actionable without friction).
**Resource Requirements:** Solo build (Expo/React Native), prioritize shipping a stable offline-first loop before adding sync/publish features.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- In-aisle scan → instant results (active stores) → add missing product name + price → add to list with quantity.
- Scan fails → fallback (manual barcode entry + recent scans) → results → add missing data.
- Family member uses Shopping List (dedupe/increment quantity; checked=in-cart).
- You manage active stores and correct/update prices locally.

**Must-Have Capabilities:**
- Active stores required before scanning; add/edit/toggle active stores.
- 1D barcode scanning with scan feedback (haptics) and flashlight toggle.
- Results screen: per-active-store rows with price + timestamp or Missing.
- Add missing data from Results: barcode (auto), product name, price; offline persistence; instant UI update.
- Fallback surfaced at 5s: manual barcode entry + recent scans.
- Shopping List: add with quantity; dedupe by barcode (increment quantity); checked=in-cart.

### Post-MVP Features

Post-MVP phases are documented in **Product Scope**:
- **Phase 2 (Post-MVP):** see **Product Scope → Growth Features (Post-MVP)**
- **Phase 3 (Expansion):** see **Product Scope → Vision (Future)**

### Risk Mitigation Strategy

**Technical Risks (Priority):**
- **Scan reliability:** validate early on target devices/lighting with curved packaging; keep a strict fallback path (5s) to avoid aisle-stall.
- **Offline persistence correctness:** treat local DB as source of truth; test “airplane mode” flows end-to-end and validate data durability across restarts.

**Market Risks:**
- Ensure the MVP reliably replaces “walk to scanner area” for you/family; measure whether you reach for the app on real trips.

**Resource Risks:**
- As a solo build, defer anything that adds complexity (accounts, sync, receipt parsing) until the core scan→results→add loop is stable and fast.

## Functional Requirements

### Store Management

- FR1: User can create a store with a name.
- FR2: User can edit a store’s name.
- FR3: User can toggle a store as Active/Inactive.
- FR4: App prevents scanning until at least one Active store exists.
- FR5: User can view the list of stores and their active status.

### Scanning & Barcode Input

- FR6: User can scan a 1D barcode (UPC/EAN) using the device camera.
- FR7: App provides scan feedback via haptics on successful read.
- FR8: User can toggle flashlight/torch while scanning.
- FR9: App offers a manual barcode entry path when scan does not succeed within 5 seconds.
- FR10: User can select a barcode from recent scans as a shortcut to results.
- FR11: App records each successful scan into a “recent scans” history.

### Results & Multi-Store Compare

- FR12: After a barcode is obtained (scan/manual), app shows a Results view for that barcode.
- FR13: Results shows a row for each Active store.
- FR14: For each Active store row, app shows either a stored price with captured timestamp or a Missing state.
- FR15: User can initiate “Add missing data” from a Missing store row.

### Product & Price Capture

- FR16: User can create/update product info for a scanned/entered barcode (at minimum: product name).
- FR17: User can add a price for a specific store and barcode.
- FR18: When adding a price from Results, the barcode is pre-filled from the scan/input.
- FR19: When adding a price, captured timestamp is stored automatically.
- FR20: After saving a price, Results updates immediately to reflect the new/updated price for that store.
- FR21: User can edit an existing price entry for a store and barcode.

### Offline-First Data & Continuity

- FR22: App supports scanning, lookup, results display, add/edit price, and shopping list actions without network connectivity.
- FR23: App persists stores, products, prices, recent scans, and shopping list items across app restarts.
- FR24: User can exit/dismiss in-progress flows and continue shopping without the app becoming blocked.

### Shopping List

- FR25: User can add a scanned product (barcode) to the Shopping List from Results.
- FR26: When adding to the Shopping List, user can set quantity at add-time.
- FR27: Shopping List prevents duplicate line items for the same barcode by incrementing quantity.
- FR28: User can increase/decrease quantity for a list item.
- FR29: User can mark a list item as checked (in cart) and uncheck it.
- FR30: User can view all list items with their quantity and checked state.

### Basic Error/Empty States

- FR31: App provides a usable flow when camera permission is denied (still allows manual barcode entry).
- FR32: App provides a usable flow when no recent scans exist (empty state).

## Non-Functional Requirements

### Performance

- NFR1: **P95** open app → Scan screen ready in **≤ 2.0s** (warm start) and **≤ 4.0s** (cold start).
- NFR2: **P95** save price → Results reflects updated row in **≤ 0.5s**.
- NFR3: **P95** open Shopping List → list visible in **≤ 1.0s**.
- NFR4: **P95** scan → Results in **< 3.0s** on successful scan.

### Reliability & Durability (Offline-First)

- NFR5: All saved stores/products/prices/recent scans/list items persist across app restarts and airplane mode.
- NFR6: It is acceptable for an **unsaved** add-price/add-product form to be lost if the app is closed/crashes/restarts.

### Usability

- NFR7: Core flows (scan → results → add missing data → add to list) remain usable one-handed and do not trap the user in a dead-end.

### Security & Privacy (Local-Only)

- NFR8: No in-app PIN/lock required; users rely on device OS security. No accounts in MVP.
