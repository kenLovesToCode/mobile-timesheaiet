---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-24T03:02:01Z'
project_name: 'priceTag'
user_name: 'ken'
date: '2026-02-24T02:04:56Z'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
32 FRs across:
- Store management (create/edit/toggle active; gate scanning until ≥1 active store)
- Scanning & barcode input (UPC/EAN scan, haptics, torch, 5s fallback to manual/recent scans)
- Results & multi-store compare (active store rows, price vs missing, add missing)
- Product & price capture (name, price, timestamp, edit, instant results update)
- Offline continuity (all core flows usable offline; persist across restarts; no blocking flows)
- Shopping list (add from results, qty, dedupe by barcode, check/in cart)
- Error/empty states (camera denied path, no recent scans state)

**Non-Functional Requirements:**
- Performance: P95 app open→scan, scan→results, save→update, list open targets
- Reliability/durability: local data persistence; unsaved form loss acceptable
- Usability: one-handed, no dead ends
- Privacy/security: local-only; no accounts; OS security only

**Scale & Complexity:**
- Primary domain: mobile app (offline-first)
- Complexity level: low–medium
- Estimated architectural components: 6–8 (UI/screens, scanning/permissions, local data layer, domain services, state management, theming/UX system, storage/recent scans/list)

### Technical Constraints & Dependencies

- Expo + React Native
- Camera scanning (UPC/EAN), torch, haptics
- Local-only data store (no network or accounts in MVP)
- Accessibility: WCAG AA, Dynamic Type, 44x44 targets
- UX direction: ultra-minimal, iOS-inspired; Tamagui tokens/theme

### Cross-Cutting Concerns Identified

- Offline-first data consistency and instant UI updates
- Scan reliability + fallback timing (5s)
- Performance budgets for scan/results/list
- Accessibility and one-handed interaction across flows

## Starter Template Evaluation

### Primary Technology Domain

Mobile app (iOS/Android) based on Expo + React Native, offline-first

### Starter Options Considered

**Tamagui Expo Router template**
- Command: `yarn create tamagui@latest --template expo-router`
- Tamagui + Expo Router starter based on the Expo starter repo
- Requires Yarn 4.4+ (per Tamagui guide)

**Expo default**
- Command: `npx create-expo-app@latest`
- Default template includes Expo Router and TypeScript
- Clean baseline; add Tamagui manually

**Expo Local-First Template**
- Command: `bunx create-expo-app --template https://github.com/expo-starter/expo-local-first-template`
- Includes Expo Router, TypeScript, SQLite, Drizzle, NativeWind/Tailwind, Zustand, and more
- Feature-rich but mismatched with Tamagui choice

### Selected Starter: Tamagui Expo Router template

**Rationale for Selection:**
Best alignment with your Tamagui-first UI system and Expo Router navigation, with minimal churn versus heavier templates.

**Initialization Command:**

```bash
yarn create tamagui@latest --template expo-router
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
TypeScript-based Expo + React Native app (template is based on the Expo starter repo).

**Styling Solution:**
Tamagui pre-integrated with Expo Router.

**Build Tooling:**
Standard Expo tooling via create-expo-app foundation.

**Testing Framework:**
Not prescribed by starter; choose later if needed.

**Code Organization:**
Expo Router file-based navigation structure.

**Development Experience:**
Yarn 4.4+ required for the Tamagui template.

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Data Architecture

**Database:** SQLite (Expo SQLite driver) as the single source of truth for all offline-first entities (stores, products, prices, recent scans, shopping list).

**ORM:** Drizzle ORM with Expo SQLite driver.
- Version: Use latest stable at implementation time; Drizzle docs for Expo SQLite show installing `drizzle-orm` alongside `expo-sqlite@next`.
- Driver: `drizzle-orm/expo-sqlite` with `expo-sqlite@next`.

**Migrations:** Auto-run on app start (versioned migrations bundled in app).

**Validation:** Zod for schema validation.
- Version: `zod@^4.0.0`.

**Caching:** No additional cache layer; UI queries SQLite directly.

### Authentication & Security

**Authentication:** None in MVP (local-only; no accounts).

**Authorization:** Not applicable in MVP (single-user local data).

**Data Encryption at Rest:** None beyond OS/device protections.

**Permissions:** Camera permission required; haptics via `expo-haptics` (Android VIBRATE permission auto-added by library). Torch usage is within camera scanning flow.

**Compliance:** None in MVP beyond platform permission prompts.

### API & Communication Patterns

**MVP API Presence:** None. MVP is local-only with no internet dependency.

**Backup/Sync Strategy (MVP):** Local export/import of SQLite data (file-based backup/restore between devices).

**Future (Post-MVP):** If/when network sync is required, add server API routes and a hosted backend (e.g., Supabase). This is deferred.

**Error Handling:** Centralized `AppError` type (normalize local and future API errors for UI).

**Logging:** Minimal console logging only.

### Frontend Architecture

**Routing:** Expo Router only (file-based routes).

**State Management:** Zustand for local UI/domain state; React Query for server sync/backup calls.

**Component Structure:** Screen components + domain hooks + repository layer for data access.

**Performance:** No additional constraints beyond PRD NFRs.

### Infrastructure & Deployment

**Hosting:** None in MVP (no server/API deployment).

**Environments:** Dev + Prod.

**CI/CD:** EAS Build only.

**Monitoring/Logging:** Minimal console logs only.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 10 areas (naming, structure, formats, process)

### Naming Patterns

**Database Naming Conventions:**
- Tables: `snake_case` plural (e.g., `stores`, `shopping_list_items`)
- Columns: `snake_case` (e.g., `store_id`, `created_at`)
- Foreign keys: `{table}_id` (e.g., `store_id`, `product_id`)
- Indexes: `idx_{table}_{column}` (e.g., `idx_prices_store_id`)

**API Naming Conventions:**
- JSON fields: `camelCase`
- Route params: `{id}` (Expo Router file naming implied)

**Code Naming Conventions:**
- Files: `kebab-case` (e.g., `store-row.tsx`, `shopping-list-item.tsx`)
- Components: `PascalCase` (e.g., `StoreRow`, `ShoppingListItem`)
- Functions/variables: `camelCase`

### Structure Patterns

**Project Organization:**
- Components organized by type (e.g., `src/components/ui`, `src/components/layout`)
- Screens in `src/screens` (or Expo Router `app/` with co-located screen components)

**Tests:**
- Co-located `*.test.ts(x)` next to source files

### Format Patterns

**Dates:**
- ISO 8601 strings in UI and JSON

**Booleans:**
- `true/false`

### Process Patterns

**Loading States:**
- Per-screen local state (no global loading store)

**Error Handling:**
- Centralized `AppError` with user-facing message mapping

## Project Structure & Boundaries

### Requirements → Structure Mapping

- Store Management → `src/features/stores/`
- Scanning & Barcode Input → `src/features/scan/`
- Results & Multi-Store Compare → `src/features/results/`
- Product & Price Capture → `src/features/pricing/`
- Offline Continuity → `src/db/`, `src/features/sync/` (local export/import helpers)
- Shopping List → `src/features/shopping-list/`
- Error/Empty States → `src/components/ui/empty-state/` + feature-local empty states
- Accessibility/UX patterns → `src/components/ui/` primitives + `src/components/layout/`

### Directory Structure (Concrete)

```
priceTag/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── stores.tsx
│   ├── scan.tsx
│   ├── results.tsx
│   ├── add-price.tsx
│   └── shopping-list.tsx
├── assets/
│   └── ...
├── docs/
│   └── MVP_SPEC.md
├── src/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── empty-state/
│   ├── features/
│   │   ├── stores/
│   │   ├── scan/
│   │   ├── results/
│   │   ├── pricing/
│   │   ├── shopping-list/
│   │   └── sync/
│   ├── db/
│   │   ├── schema/
│   │   ├── migrations/
│   │   └── client.ts
│   ├── hooks/
│   ├── services/
│   ├── state/
│   ├── theme/
│   ├── types/
│   └── utils/
├── drizzle/
│   └── ...
├── tests/
│   └── ... (co-located tests live next to source files)
├── app.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

### Integration Boundaries

- UI screens in `app/` delegate to feature modules in `src/features/`
- Data access only through `src/db/` + repository layer in `src/services/`
- Zustand stores in `src/state/` (feature slices)
- React Query only for future remote sync (kept in `src/services/sync/` when enabled)

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All core choices align: Expo + Tamagui + SQLite + Drizzle + Zustand with offline-first flows.

**Pattern Consistency:**
Naming and file conventions are consistent with Expo Router and feature organization.

**Structure Alignment:**
Project tree supports the feature mapping and data boundaries.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
All FR categories map to feature modules and DB layers.

**Non-Functional Requirements Coverage:**
Performance, offline durability, and usability constraints are reflected in architecture choices.

### Implementation Readiness Validation ✅

**Decision Completeness:**
Core choices are documented; implementation can start with starter template.

**Structure Completeness:**
Directory tree and boundaries are concrete enough for agents.

**Pattern Completeness:**
Naming, structure, and process rules are clear.

### Gap Analysis Results

**Important Gaps:**
- Backup/export format and location not specified (e.g., `.sqlite` file + share sheet flow).
- React Query is listed but no online sync in MVP; clarify if included now or deferred.
- Drizzle migration tooling not explicitly defined (drizzle-kit + schema location).

**Nice-to-Have Gaps:**
- Remove/clarify top-level `tests/` folder if tests are strictly co-located.

### Validation Issues Addressed

No critical blockers found; gaps are resolvable without changing core decisions.
