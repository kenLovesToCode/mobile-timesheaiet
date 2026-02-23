# Price Tag App — MVP Spec (Offline-First, Multi-Store Compare)

**Date:** 2026-02-23 (UTC)  
**Source:** Brainstorming session output in `/Users/kenlovestocode/Desktop/Me/ai/pricetag/_bmad-output/brainstorming/brainstorming-session-2026-02-23_17-21-14Z.md`

## 1) Problem & Goals

Shoppers want a fast, reliable way (on their phone, in-store) to scan a product barcode and instantly see known prices across multiple grocery stores, then build a simple shopping list and estimate cost.

### Primary goals (MVP)
- **Scan 1D barcode** with phone camera in real grocery conditions (curved packaging, glare).
- **Show prices for preselected “active stores”** immediately after scan.
- **Offline-first:** lookup/add/update works without network.
- **Make missing data actionable:** fast add-price flow from results.

### Non-goals (MVP)
- Third-party price APIs, store integrations, or automated receipt parsing.
- “Closest match” comparisons (only exact barcode matches).
- Robust anti-abuse / multi-user poisoning protections (track as a follow-up requirement).

## 2) Locked MVP Decisions (from Solution Matrix)
- **Store mode:** Multi-store compare (against active stores).
- **Store setup:** User preselects active stores.
- **Scan UX:** Scan → **instant results screen** (not in-camera overlay).
- **Product identity:** **Barcode-only** (barcode uniquely identifies the product for compare).
- **Price source:** User-entered prices only.
- **Missing price flow:** Results screen → select store → add price (timestamp auto).
- **Offline-first storage:** All core data local-first.
- **List model:** Single “Shopping List” with checked = “in cart”.
- **Compare rule:** Exact barcode matches only.

## 3) Target User & Context Assumptions
- User is shopping in an aisle, often **one-handed**, under time pressure.
- Camera scanning must handle **curved packaging** as a common case.
- Many items will be “missing” initially; MVP must make contribution low-friction.

## 4) Key UX Flows

### Flow A — First run: set up active stores
1. User opens app.
2. App requires selecting at least 1 store as “active” before scanning.
3. User can add a store (name) and mark it active.

### Flow B — Scan → compare → act
1. User opens **Scan**.
2. Angle coach overlay guides positioning (tilt/closer/flash prompts).
3. If scan succeeds: navigate to **Results**.
4. If scan doesn’t succeed quickly: show **fast fallback** (manual barcode entry + recent scans).

### Flow C — Results: prices across active stores
1. Results show scanned barcode (and product name if known).
2. For each active store: show **price** + **last updated timestamp**, or **Missing**.
3. If Missing: one tap opens **Add Price** for that store.

### Flow D — Add missing price (offline)
1. User picks store row → Add Price.
2. User enters price; timestamp auto-filled.
3. Save returns to Results; store row updates immediately.

### Flow E — Add to Shopping List
1. From Results, user taps “Add to List”.
2. Item added with quantity = 1 (editable later).
3. List shows items; checking an item marks it “in cart”.

## 5) Screens (MVP)

1. **Active Stores Setup**
   - Add/edit stores
   - Toggle active stores
   - Block scanning until ≥1 active store exists

2. **Scan**
   - Camera view + 1D scanning
   - Angle coach overlay (curved packaging support)
   - Flash toggle (optional)
   - Fast fallback entry point (manual barcode entry + recent scans)

3. **Results (Post-Scan)**
   - Product identifier (barcode; optional name)
   - Active store rows with: price | last updated | missing
   - Actions: add/edit price per store; add to list

4. **Add Price (Modal/Screen)**
   - Inputs: price (required)
   - Auto: timestamp
   - Optional: note (e.g., “sale”, “2 for 1”) — stored but not used for compare in MVP

5. **Shopping List**
   - List items (dedupe by barcode)
   - Quantity stepper
   - Checked state (in cart)
   - Optional “estimated total” section (see §8)

## 6) Data Model (Local-First)

Minimal entities (SQLite recommended; exact storage is implementation detail):

### `stores`
- `id` (string/uuid)
- `name` (string)
- `isActive` (boolean)
- `createdAt`, `updatedAt` (timestamps)

### `products`
- `barcode` (string, primary key)
- `name` (string, optional)
- `createdAt`, `updatedAt`

### `prices`
- `id` (string/uuid)
- `barcode` (string, FK → products)
- `storeId` (string, FK → stores)
- `priceCents` (integer) and `currency` (string, e.g. `USD`)
- `capturedAt` (timestamp) — when user observed the price
- `createdAt`, `updatedAt`

### `recentScans`
- `barcode` (string)
- `scannedAt` (timestamp)

### `shoppingListItems`
- `id` (string/uuid)
- `barcode` (string, FK → products)
- `quantity` (integer)
- `isChecked` (boolean)
- `createdAt`, `updatedAt`

## 7) Core Rules (MVP)

### Scanning
- Support **1D only** (UPC/EAN).
- Add a **cooldown** to avoid multiple rapid reads of the same barcode.
- If scan fails quickly, show fallback (manual entry + recent).

### “Missing” is not a dead-end
- Results must always provide a visible one-tap “Add price” action per missing store.

### Price trust
- Always show `capturedAt` (timestamp).
- Display a “stale” indicator when older than a configurable threshold (default TBD).

### List integrity
- Prevent duplicates by default: adding a barcode already in list increments quantity or focuses existing item (choose one in implementation).

## 8) Acceptance Criteria (MVP)

### Scan reliability (priority #1)
- Angle coach is visible and understandable while scanning.
- Manual barcode entry is reachable in ≤1 action from the scan experience.
- A user can complete scan → results (or fallback → results) with one hand.

### Results + multi-store compare (priority #2)
- After scan, Results displays rows for all active stores with clear states: price / missing.
- Adding a price for a store updates that row immediately (offline).
- Results provides an “Add to List” action.

### Offline-first
- App works in airplane mode for: scan, lookup, add price, view results, add to list.

## 9) Future Enhancements (Post-MVP)
- Variant handling + unit pricing (price-per-unit) for fair comparisons.
- Confirmation step when scan confidence is low (“wrong but confident” prevention).
- Multi-user sync + conflict rules + poisoning protection.
- Receipt import and/or store API integrations.
- Shopping plan totals: “cheapest across stores” vs “single-store trip” mode.

## 10) Suggested Project Structure (when implementing)

To align with repo conventions:
- `src/components/ui/` primitives (buttons, inputs, list rows)
- `src/components/layout/` screen scaffolds
- `src/screens/` `Scan`, `Results`, `Stores`, `ShoppingList`
- `src/theme/` tokens, spacing, typography

