---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
---

# priceTag - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for priceTag, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a store with a name.
FR2: User can edit a store’s name.
FR3: User can toggle a store as Active/Inactive.
FR4: App prevents scanning until at least one Active store exists.
FR5: User can view the list of stores and their active status.
FR6: User can scan a 1D barcode (UPC/EAN) using the device camera.
FR7: App provides scan feedback via haptics on successful read.
FR8: User can toggle flashlight/torch while scanning.
FR9: App offers a manual barcode entry path when scan does not succeed within 5 seconds.
FR10: User can select a barcode from recent scans as a shortcut to results.
FR11: App records each successful scan into a “recent scans” history.
FR12: After a barcode is obtained (scan/manual), app shows a Results view for that barcode.
FR13: Results shows a row for each Active store.
FR14: For each Active store row, app shows either a stored price with captured timestamp or a Missing state.
FR15: User can initiate “Add missing data” from a Missing store row.
FR16: User can create/update product info for a scanned/entered barcode (at minimum: product name).
FR17: User can add a price for a specific store and barcode.
FR18: When adding a price from Results, the barcode is pre-filled from the scan/input.
FR19: When adding a price, captured timestamp is stored automatically.
FR20: After saving a price, Results updates immediately to reflect the new/updated price for that store.
FR21: User can edit an existing price entry for a store and barcode.
FR22: App supports scanning, lookup, results display, add/edit price, and shopping list actions without network connectivity.
FR23: App persists stores, products, prices, recent scans, and shopping list items across app restarts.
FR24: User can exit/dismiss in-progress flows and continue shopping without the app becoming blocked.
FR25: User can add a scanned product (barcode) to the Shopping List from Results.
FR26: When adding to the Shopping List, user can set quantity at add-time.
FR27: Shopping List prevents duplicate line items for the same barcode by incrementing quantity.
FR28: User can increase/decrease quantity for a list item.
FR29: User can mark a list item as checked (in cart) and uncheck it.
FR30: User can view all list items with their quantity and checked state.
FR31: App provides a usable flow when camera permission is denied (still allows manual barcode entry).
FR32: App provides a usable flow when no recent scans exist (empty state).

### NonFunctional Requirements

NFR1: P95 open app → Scan screen ready in ≤ 2.0s (warm start) and ≤ 4.0s (cold start).
NFR2: P95 save price → Results reflects updated row in ≤ 0.5s.
NFR3: P95 open Shopping List → list visible in ≤ 1.0s.
NFR4: P95 scan → Results in < 3.0s on successful scan.
NFR5: All saved stores/products/prices/recent scans/list items persist across app restarts and airplane mode.
NFR6: It is acceptable for an unsaved add-price/add-product form to be lost if the app is closed/crashes/restarts.
NFR7: Core flows (scan → results → add missing data → add to list) remain usable one-handed and do not trap the user in a dead-end.
NFR8: No in-app PIN/lock required; users rely on device OS security. No accounts in MVP.

### Additional Requirements

- Starter template specified: Tamagui Expo Router template; initialization via `yarn create tamagui@latest --template expo-router`. This should be Epic 1, Story 1.
- Mobile app must be Expo + React Native with Expo Router (file-based routing).
- Offline-first data layer with SQLite as source of truth; Drizzle ORM with Expo SQLite driver; Zod for schema validation.
- Auto-run versioned migrations on app start (bundled in app).
- Local export/import of SQLite data for backup/restore (file-based) in MVP.
- No network/API in MVP; React Query reserved for future sync/backup calls.
- Camera permission required; torch/flashlight support during scanning; haptics for scan feedback.
- Accessibility: WCAG AA targets, Dynamic Type support, 44x44 minimum tap targets, screen reader-friendly labels.
- UX direction: calm, ultra-minimal iOS-inspired UI; one primary CTA per screen with contextual row actions.
- Results must emphasize product identity (name + barcode) and captured timestamp for trust.
- Scan fallback is time-based (~5 seconds) and must offer manual entry + recent scans in one tap.
- “Missing” must be actionable (tap row → Add Price sheet) and never a dead end.
- One-handed use prioritized; allow dismissing flows without blocking shopping.
- Light/Dark themes with Grocery Green accent tokens (if using the UX spec tokens).

### FR Coverage Map

FR1: Epic 2 - Store setup and active gating enable the core loop
FR2: Epic 2 - Store setup and active gating enable the core loop
FR3: Epic 2 - Store setup and active gating enable the core loop
FR4: Epic 2 - Store setup and active gating enable the core loop
FR5: Epic 2 - Store setup and active gating enable the core loop
FR6: Epic 2 - Scan to results for instant lookup
FR7: Epic 2 - Scan feedback for confidence
FR8: Epic 2 - Torch support in scan flow
FR9: Epic 2 - 5s fallback to manual entry
FR10: Epic 2 - Recent scans shortcut to results
FR11: Epic 2 - Record successful scans
FR12: Epic 2 - Results view for barcode
FR13: Epic 2 - Active store rows in results
FR14: Epic 2 - Price or Missing per store
FR15: Epic 2 - Missing triggers add flow
FR16: Epic 2 - Product info capture
FR17: Epic 2 - Store-specific price capture
FR18: Epic 2 - Prefill barcode from scan/input
FR19: Epic 2 - Auto-captured timestamp
FR20: Epic 2 - Instant results update after save
FR21: Epic 2 - Edit existing price entry
FR22: Epic 2 - Offline core loop support
FR23: Epic 2 - Persistence across restarts
FR24: Epic 2 - Non-blocking flows
FR25: Epic 3 - Add to Shopping List from results
FR26: Epic 3 - Set quantity at add-time
FR27: Epic 3 - Dedupe by barcode with increment
FR28: Epic 3 - Adjust quantity
FR29: Epic 3 - Check/uncheck items
FR30: Epic 3 - View list items
FR31: Epic 2 - Camera denied path to manual entry
FR32: Epic 2 - Empty recent scans state

## Epic List

### Epic 1: Foundations and Local-First Setup
Users can open the app with base UI scaffolding and the local-first data layer ready, providing a stable offline foundation for all later features.
**FRs covered:** None (foundation epic)

### Epic 2: Instant Price Lookup and Contribution Loop
Users can set up active stores, scan or enter a barcode, instantly see store-specific results, and add or update missing prices offline with immediate updates and no dead ends.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR31, FR32

### Epic 3: In-Store Shopping List
Users can add scanned products to a simple list, manage quantity, prevent duplicates by barcode, and check items as they go.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30

## Epic 1: Foundations and Local-First Setup

Users can open the app with base UI scaffolding and the local-first data layer ready, providing a stable offline foundation for all later features.

### Story 1.1: Base App Initialization and Configuration

As a developer,
I want the app’s core configuration and environment set up,
So that the project builds reliably and supports future features.

**Acceptance Criteria:**

**Given** the project is opened in the repo
**When** I install dependencies and run the app
**Then** it launches without configuration errors

**Given** the project uses TypeScript
**When** the app is built or type-checked
**Then** the configuration passes without type errors attributable to setup

**Given** the app runs on iOS and Android
**When** I start the dev server
**Then** platform configuration is valid and the app renders the initial screen

**Given** baseline tooling is configured
**When** I run the standard scripts (lint/build/start)
**Then** they complete without setup-related failures

### Story 1.2: Local Database Setup (SQLite + Drizzle + Zod)

As a developer,
I want the local database stack configured with schema validation and migrations,
So that offline data storage is reliable and ready for feature work.

**Acceptance Criteria:**

**Given** the project dependencies are installed
**When** the app starts
**Then** the SQLite database initializes without errors

**Given** a local schema is defined
**When** the app launches
**Then** versioned migrations run automatically before feature access

**Given** the data layer is configured
**When** I perform a basic create/read operation in dev
**Then** it succeeds using Drizzle with the Expo SQLite driver

**Given** entities are validated
**When** invalid data is passed to the data layer
**Then** Zod validation fails with a clear error

### Story 1.3: Core Packages and Permissions Setup

As a developer,
I want core device packages and permissions configured,
So that scanning, torch, and haptics are ready for feature implementation.

**Acceptance Criteria:**

**Given** the app targets iOS and Android
**When** I install required packages for camera scanning, torch, and haptics
**Then** the project builds without dependency conflicts

**Given** the app needs camera access
**When** I run the app on a device
**Then** the camera permission prompt is configured correctly

**Given** torch and haptics will be used
**When** the app runs on device
**Then** the required platform permissions/entitlements are present and no runtime permission errors occur

### Story 1.4: App Shell and Navigation Scaffold

As a user,
I want a basic app shell with primary navigation in place,
So that core screens can be accessed in a consistent structure.

**Acceptance Criteria:**

**Given** the app launches
**When** I view the primary navigation
**Then** the core routes are present with placeholder screens

**Given** navigation uses Expo Router
**When** I navigate between primary routes
**Then** the transitions work without errors

**Given** a base layout is defined
**When** I open the app
**Then** the layout respects safe areas and renders consistently across iOS and Android

### Story 1.5: UI System Setup (Theme, Tokens, Base Components)

As a user,
I want a consistent, calm visual system across screens,
So that the app feels trustworthy and easy to use in the aisle.

**Acceptance Criteria:**

**Given** the UI theme is configured
**When** I open any primary screen
**Then** colors, typography, spacing, and radii follow the defined tokens

**Given** base components are implemented (Text, Button, Input, ListRow, Surface)
**When** they are used in placeholder screens
**Then** they render consistently across iOS and Android

**Given** accessibility standards are required
**When** I interact with UI elements
**Then** tap targets meet 44x44 minimum and text respects Dynamic Type

## Epic 2: Instant Price Lookup and Contribution Loop

Users can set up active stores, scan or enter a barcode, instantly see store-specific results, and add or update missing prices offline with immediate updates and no dead ends.

### Story 2.1: Store Setup and Active Gating

As a shopper,
I want to create and manage my stores and mark which ones are active,
So that scanning and results are relevant to where I shop.

**Acceptance Criteria:**

**Given** I open the Stores screen
**When** I add a store name and save
**Then** the store appears in the list

**Given** a store exists
**When** I edit its name
**Then** the updated name is shown in the list

**Given** a store exists
**When** I toggle it Active/Inactive
**Then** its active status updates immediately

**Given** I try to access Scan with zero active stores
**When** I open the Scan screen
**Then** I am guided to activate at least one store before scanning

### Story 2.2: Add or Edit Price and Product Info

As a shopper,
I want to add or update product info and store-specific prices from Results,
So that missing or incorrect prices are fixed immediately.

**Acceptance Criteria:**

**Given** I’m on Results with a Missing store row
**When** I tap the row to add price
**Then** the add flow opens with the store selected and barcode prefilled

**Given** the product name is unknown
**When** I add a price
**Then** I can enter the product name in the same flow

**Given** I save a price
**When** the save completes
**Then** the captured timestamp is stored automatically

**Given** I save a price
**When** I return to Results
**Then** the store row updates immediately with the new price

**Given** a store already has a price
**When** I choose to edit it
**Then** I can update the price and see Results update immediately

### Story 2.3: Results View for Active Stores

As a shopper,
I want to see Results for a scanned or entered barcode across my active stores,
So that I can quickly compare prices or see what’s missing.

**Acceptance Criteria:**

**Given** I obtain a barcode (scan or manual)
**When** I open Results
**Then** I see a row for each Active store

**Given** a store has a saved price for this barcode
**When** Results loads
**Then** the row shows price and captured timestamp

**Given** a store has no saved price for this barcode
**When** Results loads
**Then** the row shows a Missing state that is actionable

**Given** a product name is known
**When** Results loads
**Then** the product name is shown prominently with the barcode visible

### Story 2.4: Scan Flow with Haptics and Torch

As a shopper,
I want to scan a 1D barcode quickly with feedback and torch support,
So that scanning works in real aisle conditions.

**Acceptance Criteria:**

**Given** I open the Scan screen
**When** I point the camera at a UPC/EAN barcode
**Then** the app detects the barcode and proceeds to Results

**Given** a scan succeeds
**When** the barcode is captured
**Then** I receive haptic feedback

**Given** I am scanning in low light
**When** I toggle the torch
**Then** the camera torch turns on/off without errors

### Story 2.5: Fallback to Manual Entry and Recent Scans

As a shopper,
I want a fast fallback if scanning fails,
So that I can still reach Results quickly.

**Acceptance Criteria:**

**Given** scanning has not succeeded after ~5 seconds
**When** the fallback appears
**Then** I can choose manual barcode entry or a recent scan

**Given** I choose manual entry
**When** I enter a valid barcode
**Then** I am taken to Results for that barcode

**Given** I choose a recent scan
**When** I select one
**Then** I am taken to Results for that barcode

**Given** a scan succeeds
**When** it completes
**Then** it is recorded into recent scans history

### Story 2.6: Permission Denied and Empty State Handling

As a shopper,
I want the app to handle missing permissions and empty states gracefully,
So that I can still use core features.

**Acceptance Criteria:**

**Given** camera permission is denied
**When** I attempt to scan
**Then** I’m routed to manual entry and recent scans instead

**Given** I open recent scans with no history
**When** the list is empty
**Then** I see a clear empty state with a path to manual entry

### Story 2.7: Non-Blocking Flow Behavior

As a shopper,
I want to dismiss in-progress actions without being blocked,
So that I can keep shopping.

**Acceptance Criteria:**

**Given** I start adding a price
**When** I dismiss the flow without saving
**Then** I can continue using the app without being blocked

**Given** I leave Results or Scan mid-flow
**When** I return later
**Then** the app remains usable and does not force completion of a prior action

## Epic 3: In-Store Shopping List

Users can add scanned products to a simple list, manage quantity, prevent duplicates by barcode, and check items as they go.

### Story 3.1: Add to Shopping List with Quantity

As a shopper,
I want to add a scanned product to the Shopping List with a quantity,
So that I can track what I need to buy.

**Acceptance Criteria:**

**Given** I’m on Results
**When** I choose Add to List
**Then** the item is added with a quantity I can set at add time

**Given** I add an item
**When** I return to the Shopping List
**Then** the item appears with the selected quantity

### Story 3.2: Dedupe by Barcode and Adjust Quantity

As a shopper,
I want duplicate items to increment quantity instead of adding new rows,
So that my list stays clean and accurate.

**Acceptance Criteria:**

**Given** an item with a barcode is already on the list
**When** I add the same barcode again
**Then** the list increments quantity instead of creating a duplicate row

**Given** a list item exists
**When** I increase or decrease its quantity
**Then** the displayed quantity updates immediately

### Story 3.3: Check Items In Cart and View List

As a shopper,
I want to check items as I add them to my cart and view my full list,
So that I can track shopping progress.

**Acceptance Criteria:**

**Given** I open the Shopping List
**When** I view all items
**Then** I see each item with quantity and checked status

**Given** a list item exists
**When** I toggle its checked state
**Then** the item reflects in-cart status immediately
