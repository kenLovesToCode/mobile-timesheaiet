---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/prd-validation-report.md
  - docs/MVP_SPEC.md
lastStep: 14
---

# UX Design Specification priceTag

**Author:** sensei
**Date:** 2026-02-24T05:02:22+08:00

---

<!-- UX design content will be appended sequentially through collaborative workflow steps -->

## Executive Summary

### Project Vision

priceTag is an offline-first mobile app for in-aisle grocery shopping. Users scan a 1D barcode (UPC/EAN) and instantly see store-specific prices across their preselected “active stores”, including when each price was last captured. When data is missing, the primary UX move is to let the user add a price quickly, save locally, and see Results update immediately—no network required.

### Target Users

- Primary: A shopper (you) in-store, often one-handed, under time pressure, who needs fast price certainty without walking to a scanner area or asking staff.
- Secondary: A family member using a simple Shopping List during a trip (deduped items, quantity, check-off in cart).

### Key Design Challenges

- Deliver a fast, reliable scan→results experience in real grocery conditions (curved packaging, glare) while maintaining user confidence.
- Provide a clear, low-friction fallback (manual barcode entry + recent scans) when scanning doesn’t succeed quickly (~5s).
- Present multi-store Results that are instantly readable (price + captured timestamp vs Missing) and make Missing actionable without adding clutter.
- Preserve “offline-first trust”: communicate recency and edits without overwhelming users.

### Design Opportunities

- Turn missing data into a smooth contribution loop (Missing → Add Price) that feels like part of shopping, not an interruption.
- Make “compare across stores” visually effortless (scanable rows, subtle emphasis, clear action placement).
- Keep the Shopping List extremely lightweight and one-handed, so it remains useful even for non-scanners.

## Core User Experience

### Defining Experience

The core experience is: **Scan a 1D barcode (UPC/EAN) → instantly see the product name + store-specific prices across active stores → take action (add missing price / add to list) without breaking shopping momentum**.

The MVP must be optimized for in-aisle, one-handed use under time pressure. “Missing” is expected early and must be treated as a first-class, fast contribution loop—not a dead end.

Core loop (MVP):

1. Ensure at least one store is Active (or guide user to activate one).
2. Scan barcode (with confidence-building guidance).
3. Results show:
   - **Product identifier:** product name (if known) + barcode
   - **Active store rows:** price + captured timestamp OR Missing
4. If product name is unknown, provide a lightweight way to add it (ideally within the same “add missing data” flow as price, or a quick edit action).
5. If a store price is Missing: one tap to Add Price (barcode prefilled), save offline, results update immediately.
6. Optional: Add to Shopping List (dedupe by barcode, quantity, checked=in-cart).

### Platform Strategy

- **Platform:** Mobile app (iOS + Android).
- **Primary interaction:** Touch, one-handed.
- **Device capabilities to leverage:** Camera (scan), torch toggle, haptics feedback.
- **Offline-first:** The app must support scan, lookup, results, add/edit price, and shopping list flows without network connectivity. Local data is the source of truth in MVP.

### Effortless Interactions

- Launch and reach scanning fast; scanning never feels “stuck”.
- Clear scan feedback (success haptic; visible progress state).
- **Fallback at ~5 seconds** is obvious and one-tap: manual barcode entry + recent scans.
- Results are instantly scannable:
  - Product name is prominent (when known) to reduce “wrong item” anxiety.
  - Store rows clearly communicate “price vs missing” at a glance.
- “Add missing data” is minimal typing and fast completion (barcode prefilled, timestamp automatic; product name captured when needed).
- After saving, Results updates immediately (offline).
- Shopping List add is one tap from Results, with simple quantity control and dedupe behavior.

### Critical Success Moments

- **Make-or-break #1:** The first time scan fails, the fallback is offered quickly and feels like a normal path (not an error).
- **Make-or-break #2:** Results readability—user immediately recognizes the item (name) and answers “do I know the price here?” and “where is it cheaper?”.
- **Make-or-break #3:** Missing → Add Price (and name, if needed) feels fast enough that the user continues shopping without frustration.
- **Trust moment:** Captured timestamps (and later “stale” cues) create confidence.

### Experience Principles

1. **Never stall the aisle:** always offer a clear next action; fallback is first-class.
2. **Recognize the item:** show product name when known; make naming easy when unknown.
3. **Missing is actionable:** every Missing state must present a simple, immediate contribution path.
4. **One-handed speed over richness:** minimize steps, typing, and navigation depth.
5. **Offline is the default:** treat local saves and instant UI updates as the normal behavior.
6. **Trust through clarity:** show when a price was captured; avoid ambiguity in results states.

## Desired Emotional Response

### Primary Emotional Goals

- **Calm + in-control:** The app reduces aisle stress and decision fatigue.
- **Helpfulness + “this is great”:** After a successful scan, the user feels assisted and supported (like the app just saved them time).
- **Trust without doubt:** The user believes the result is correct (right item, right store context, clearly explained recency).

### Emotional Journey Mapping

- **First discovery / first run:** “This is simple.” (No overwhelm; clear setup for active stores.)
- **During scanning (happy path):** Calm focus and momentum (the app feels responsive and confident).
- **During scanning (failure path):** Reassurance and guidance—not blame. The user thinks “barcode may be damaged/unscannable” and immediately sees a fallback.
- **On Results:** Relief + clarity (“I have the answer”) and confidence (“this is the right product/price info”).
- **When data is missing:** Empowered to fix it quickly (“I can add this in seconds”) rather than stuck.
- **After action (saved price / added to list):** Small satisfaction + progress (shopping continues smoothly).

### Micro-Emotions

Most important micro-emotions to design for:

- **Confidence > confusion** (especially: “is this the right item?”)
- **Trust > skepticism** (prices and timestamps feel believable)
- **Relief > anxiety** (quickly replaces the “I can’t find the price” stress)
- **Accomplishment > frustration** (adding missing info feels fast and worthwhile)

### Design Implications

- **Calm:** Minimal visual noise, clear hierarchy, predictable navigation, large tap targets.
- **Great/helpful:** Fast feedback (haptics, clear state changes), “you’re done” moments after scan and after save.
- **No doubt:** Show product name prominently when known; show barcode; show captured timestamp; avoid ambiguous states.
- **Scan failure without blame:** Copy and UI that frames failure as situational (“barcode may be damaged”) + immediate fallback (manual entry + recent scans).
- **Missing doesn’t create doubt:** Missing is presented as normal and actionable (“Add price”) rather than an error.

Emotion → UX approach:

- Calm → simple screen layouts, fewer choices per screen, stable UI.
- Trust → product name + barcode + timestamp, consistent formatting, clear “Missing” state.
- Helpful/great → one-tap actions, immediate results update after save (offline).

### Emotional Design Principles

1. **Reassure, don’t blame:** failures are situational; always offer a next step.
2. **Reduce doubt with identity:** make it obvious the scanned item is correct (name + barcode).
3. **Clarity beats cleverness:** Results should feel instantly understandable.
4. **Progress feels good:** saving a price or adding to list should feel like a small win.
5. **Keep the aisle calm:** nothing should feel chaotic, slow, or uncertain.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Inspiration Direction: Calm / Minimal (Apple-like)**

- Prioritize clarity, whitespace, and a small number of obvious actions per screen.
- Use restrained color and strong typography hierarchy to reduce aisle stress.
- Favor “quiet confidence”: the UI feels stable, predictable, and non-alarming.

**Inspiration Direction: Camera-first scanning with fast form fallback**

- The camera experience is the primary path; fallback is treated as normal and immediate, not as an error state.
- Transitions between camera → results (and camera → fallback) should feel smooth and intentional.

### Transferable UX Patterns

**Navigation patterns**

- **Single primary flow:** Stores (setup) → Scan → Results → (Add Price / Add to List).
- **Clear gating:** If no active stores, redirect to a calm setup screen (no dead-end / no confusing disabled scanner).
- **Modal for quick capture:** “Add Price” as a lightweight modal/sheet to preserve context and keep the user in the aisle.

**Interaction patterns**

- **Camera-first with calm guidance:** Minimal scan guidance (subtle prompts, not noisy overlays).
- **Fast fallback within one action:** At ~5 seconds, present a simple choice: manual entry + recent scans.
- **Instant confirmation:** After save, update Results immediately and show a small “saved” confirmation (no drama).

**Visual patterns**

- **Minimal Results list:** Store rows are simple and consistent; “Missing” is a quiet, actionable state.
- **Trust cues without clutter:** Product name + barcode + captured timestamp shown with clear hierarchy (name first).
- **Minimal emphasis:** Use subtle highlighting for “cheapest” or “current store” (if needed) rather than bold, busy badges.

### Anti-Patterns to Avoid

- **Loud scanning UIs:** busy overlays, too many callouts, or constant error messaging increases stress and doubt.
- **Blamey failure language:** “You did it wrong” vibes; avoid shaming copy.
- **Dead-end missing states:** “No price found” without an obvious Add Price action.
- **Over-dense Results:** too many icons/metadata competing with the core question (“what’s the price here?”).
- **Multi-step fallback:** requiring several taps to manually enter a barcode.

### Design Inspiration Strategy

**What to Adopt**

- Calm/minimal layout and typography-first hierarchy to keep scanning and results emotionally “quiet”.
- Camera-first primary action with a clear time-based fallback (manual entry + recent scans).
- Instant, local-first updates with small confirmation moments after save.

**What to Adapt**

- Minimal scan guidance: keep it subtle, but ensure it still supports real-world conditions (glare/curvature).
- Calm Results: maintain minimalism, but keep trust signals visible (product name, barcode, timestamp).

**What to Avoid**

- Anything that increases doubt: ambiguous states, unclear item identity, or uncertain transitions.
- Extra UI density that slows comprehension in the aisle.

## Design System Foundation

### 1.1 Design System Choice

**Chosen approach:** **Custom token-based design system (iOS-inspired)** built on React Native core components, plus **selective library use** only where it meaningfully accelerates development without shifting the product into a Material/Android aesthetic.

### Rationale for Selection

- **Balance (speed + uniqueness):** Tokens + reusable components give speed, while staying visually distinct and “quiet”.
- **iOS-like emotional goal:** Supports the calm/minimal, confidence-building tone we want in-aisle.
- **Fits current codebase:** Current dependencies are minimal; this avoids heavy UI framework lock-in early.
- **Future-proof:** We can later adopt a small component library for specific needs (e.g., sheets, toasts) without redesigning everything.

### Implementation Approach

- **Design tokens first:** define color, typography, spacing, radius, shadows, and motion tokens.
- **Core primitives:** `Text`, `Button`, `IconButton`, `Input`, `ListRow`, `Card/Surface`, `Sheet/Modal`, `Toast`, `Divider`, `EmptyState`.
- **Screen scaffolds:** consistent headers, safe areas, and layout patterns across Stores / Scan / Results / Add Price / Shopping List.
- **Accessibility defaults:** tap targets, readable type scale, contrast-safe colors, and clear focus states.

### Customization Strategy

- **iOS-inspired typography + spacing:** clean hierarchy, generous whitespace, restrained emphasis.
- **Calm color system:** neutral base + one primary accent; use color sparingly for state.
- **Dark mode-ready tokens:** optional, but aligns strongly with iOS feel and “calm”.
- **Avoid Material cues:** avoid heavy filled surfaces, loud icons, and dense badges that increase doubt/stress.

## 2. Core User Experience

### 2.1 Defining Experience

**Defining interaction (tell-a-friend):** “You just scan it and boom—you’ve got the price (and a quick comparison across your stores).”

This experience is about replacing friction (hunt for shelf tags, ask staff, walk to a scanner area) with a calm, instant answer. The “boom” should feel fast, confident, and low-effort: scan → recognize item → see store rows → act.

### 2.2 User Mental Model

**How users think about the task:**

- “I’m holding an item. I want to know what it costs here (and whether it’s cheaper at my other stores).”
- Scanning is expected to be the fastest path; manual entry is an acceptable backup when the barcode is damaged or hard to read.
- Users expect the app to recognize the item (product name) and confirm identity to reduce doubt.

**Current workaround mental model:**

- If price isn’t visible, users assume they’ll lose time: searching tags, asking, or walking to a scanner.
- They’re time-pressured and often one-handed; they want the app to “just work” or quickly offer a plan B.

**Likely confusion points:**

- “Is this the right product?” (identity doubt)
- “Is this price current?” (recency trust)
- “Why won’t it scan?” (fear of doing it wrong)

### 2.3 Success Criteria

Users say “this just works” when:

- Results appear fast (goal: < 3 seconds on successful scan).
- The item feels correctly identified (product name + barcode visible).
- The compare view is immediately readable (active store rows; price vs Missing is obvious).
- When scan fails, fallback appears quickly (~5 seconds) and feels normal, not like an error.
- Adding missing data is quick and updates Results immediately (offline).

Success indicators (visible feedback):

- Subtle haptic + clear transition on successful scan.
- Calm progress messaging during scan (no alarming errors).
- Small “saved” confirmation after adding price/name.

### 2.4 Novel UX Patterns

This is primarily an **established pattern** (camera scan → results list), with a small “unique twist”:

- **Multi-store compare** as the default results model (against your active stores).
- **Missing as primary action**: the UI treats missing info as a quick contribution loop, not a failure.

No novel interaction that requires heavy education—keep it familiar and calm.

### 2.5 Experience Mechanics

**1. Initiation**

- Entry point: Scan is the primary action (home tab or primary screen).
- If no active stores: calm gating flow to activate/add at least one store, then return to Scan.

**2. Interaction**

- Camera opens with minimal guidance (calm overlay, optional torch).
- System attempts reads; avoid spammy errors.
- If scan success: transition immediately to Results.
- If no success around ~5 seconds: show fallback (manual entry + recent scans) within one action.

**3. Feedback**

- On success: haptic + instant transition.
- On failure: reassurance copy (barcode may be damaged/unscannable) + clear fallback.
- On Results: product name prominent; barcode visible; store rows stable and scannable.

**4. Completion**

- Completion state is the Results screen: user has the answer.
- Next actions:
  - Add Price for a specific store (and product name if missing).
  - Add to Shopping List (quantity, dedupe).
- After save: Results row updates immediately; show subtle confirmation; user continues shopping.

## Visual Design Foundation

### Color System

**Theme direction:** Grocery Green (calm, minimal, iOS-inspired) with Dark Mode support.

**Semantic colors (Light)**

- `bg`: `#F2F7F3`
- `surface`: `#FFFFFF`
- `textPrimary`: `#1C1C1E`
- `textSecondary`: `#6D6D72`
- `border`: `#D1D6D1`
- `accent`: `#34C759` (primary action / key highlights)
- `success`: `#34C759`
- `warning`: `#FFCC00`
- `danger`: `#FF3B30`

**Semantic colors (Dark)**

- `bg`: `#000000`
- `surface`: `#1C1C1E`
- `textPrimary`: `#FFFFFF`
- `textSecondary`: `#A1A1A6`
- `border`: `#2C2C2E`
- `accent`: `#34C759`
- `success`: `#34C759`
- `warning`: `#FFD60A`
- `danger`: `#FF453A`

**Usage rules**

- Use `accent` sparingly: primary CTA (e.g., “Add Price”, “Add to List”), subtle emphasis (e.g., cheapest).
- “Missing” should be calm and actionable (not red): neutral text + clear CTA.
- Prioritize trust: product name + barcode + captured timestamp use hierarchy, not color noise.

### Typography System

**Typeface:** system default (SF on iOS; system on Android) tuned for iOS-like hierarchy.

**Type scale (guideline)**

- Large Title: 34
- Title: 28 / 22
- Headline: 17 (semi-bold)
- Body: 17
- Callout: 16
- Footnote: 13
- Caption: 12

**Hierarchy rules**

- Results: product name is highest emphasis; barcode + timestamp are secondary (to reduce doubt without clutter).
- Buttons: short labels; avoid all-caps; prefer sentence case.

### Spacing & Layout Foundation

- Base spacing unit: 4
- Common spacing tokens: 4, 8, 12, 16, 24, 32
- Minimum tap target: 44x44
- Corner radius: 12 (surfaces/sheets), 10 (inputs), 8 (small elements)
- Layout tone: airy and calm (whitespace > density), especially on Scan and Results.

### Accessibility Considerations

- Support Dynamic Type / font scaling for core text.
- Maintain readable contrast in both themes (text on surface first; color is secondary).
- Clear focus/pressed states for one-handed use; avoid relying on color alone to convey “Missing” vs “Price”.

## Design Direction Decision

### Design Directions Explored

We explored 8 variations across:

- Airy card-based layouts vs compact lists
- Results actions as buttons vs sheets vs persistent bars
- Compare emphasis (cheapest/current store) vs ultra-minimal calm
- Trust-first identity cues vs reduced UI density

### Chosen Direction

**Chosen Direction:** **Direction 5 — Ultra minimal (one primary CTA)**

**Key elements to keep**

- Calm, spacious layout with minimal simultaneous choices.
- Results focused on: product identity (name + barcode) and store rows.
- One primary CTA visible (e.g., “Add to list”), with secondary actions triggered contextually.

**Guardrails (to preserve “boom” and avoid doubt)**

- “Missing” store rows must be obviously actionable (tap row → Add Price) with clear affordance and no dead ends.
- Scan fallback remains one-tap and time-based (~5s): manual entry + recent scans.
- Product name is prominent on Results; barcode + timestamp remain visible to reduce doubt.

### Design Rationale

This direction best matches the emotional goals:

- **Calm:** less visual noise and fewer competing actions reduces aisle stress.
- **Trust:** strong hierarchy (product name first) reduces “wrong item” doubt.
- **Helpfulness:** contextual actions keep the flow fast without clutter.

### Implementation Approach

- Use the token-based iOS-inspired system (Grocery Green accent) with Dark Mode.
- Implement Results as a stable list of store rows with clear row interactions:
  - Tap Missing row → Add Price
  - Tap priced row → Edit Price (secondary)
- Keep primary CTA consistent per screen (Scan: camera-first; Results: Add to list).

## User Journey Flows

### Journey 1 — First Run / Store Gating (Ultra-minimal)

Goal: ensure user can scan only after selecting ≥1 active store, without confusion.

```mermaid
flowchart TD
  A[App open] --> B{Has ≥1 Active Store?}
  B -- No --> C[Stores Setup (calm explanation)]
  C --> D[Add store name]
  D --> E[Toggle Active = ON]
  E --> F[Return to Scan]
  B -- Yes --> F[Scan]
```

Notes:

- Keep one primary CTA on gating screen: “Add a store” or “Select active stores”.
- Never show a dead/disabled scanner without explanation.

---

### Journey 2 — Scan → “Boom” Results → Act (Happy Path)

Goal: camera-first scan yields fast Results with identity + store compare; Missing is actionable.

```mermaid
flowchart TD
  A[Scan (camera-first)] --> B{Barcode detected?}
  B -- Yes --> C[Results]
  C --> C1[Show product name (if known)]
  C --> C2[Show barcode + captured timestamps (secondary)]
  C --> D{Per-store state}
  D -->|Price exists| E[Store row shows price + timestamp]
  D -->|Missing| F[Store row shows Missing]
  F --> G[Tap Missing row → Add Price]
  G --> H[Add Price (barcode prefilled; store selected)]
  H --> I{Product name known?}
  I -- No --> J[Capture product name (lightweight)]
  I -- Yes --> K[Enter price]
  J --> K[Enter price]
  K --> L[Save (offline)]
  L --> M[Results updates instantly + subtle confirmation]
  C --> N[Primary CTA: Add to List]
  N --> O[Shopping List: dedupe by barcode; qty; check=in-cart]
```

Notes (ultra-minimal guardrails):

- Results always show **product name prominently** (or “Unnamed product” + quick “Edit name”).
- “Add to List” stays the single primary CTA on Results.
- Add Price is contextual (tap Missing store row).

---

### Journey 3 — Scan Fails → Fallback → Results (Recovery Path)

Goal: user never feels stuck; fallback feels normal and immediate.

```mermaid
flowchart TD
  A[Scan (camera-first)] --> B{Barcode detected within ~5s?}
  B -- Yes --> C[Results]
  B -- No --> D[Fallback prompt (calm, not blame)]
  D --> E[Choose: Manual entry OR Recent scans]
  E -->|Manual entry| F[Enter barcode form]
  E -->|Recent scans| G[Recent list]
  F --> H{Valid barcode?}
  H -- Yes --> C[Results]
  H -- No --> I[Inline error + keep editing]
  G --> C[Results]
  C --> J{Missing price?}
  J -- Yes --> K[Tap store row → Add Price]
  K --> L[Save offline → Results updates instantly]
```

Optional edge recoveries (kept minimal in UI):

- Camera permission denied → route to Manual entry + Recent scans (still reaches Results).
- No recent scans → show empty state with single CTA: “Enter barcode”.

---

### Journey Patterns

- **Gating pattern:** If prerequisites missing (active stores), redirect to a calm setup screen with one CTA.
- **Navigation model:** Primary tabs for Home, Stores, Scan, Shopping; Results is a flow destination, not a tab.
- **Contextual action pattern:** Secondary actions are row-tap / contextual (e.g., Missing → Add Price).
- **Identity-first pattern:** Name is primary; barcode + timestamp are always visible but secondary to reduce doubt.
- **Offline-first confirmation pattern:** Save → instant Results update + subtle “Saved” feedback.

### Flow Optimization Principles

- One-handed and calm: reduce decisions per screen; keep one primary CTA.
- Never stall: fallback at ~5 seconds; no dead ends.
- Reduce doubt: product identity and recency are visible without clutter.
- Make contribution satisfying: Missing → Add Price should feel fast and “worth it”.

## Component Strategy

### Design System Components

**Foundation library:** Tamagui (theme + primitives)

**Use Tamagui for:**

- Layout primitives: `YStack`, `XStack`, `Stack`, `Spacer`, `ScrollView`
- Typography: `Text`, headings, secondary text styles
- Inputs: `Input`, numeric input patterns
- Buttons: `Button`, `IconButton` (or `Button` variants)
- Lists: `ListItem` (as a base), separators/dividers
- Toggles: `Switch` (Active store toggle)
- Overlays: `Sheet` (Add Price modal), dialogs
- Feedback: `Toast` / subtle “Saved” confirmation
- Theming: tokens for Grocery Green + Dark Mode

**Project tokens to implement in Tamagui theme:**

- Colors: bg/surface/text/border/accent + status colors (light/dark)
- Spacing scale: 4-based (4, 8, 12, 16, 24, 32)
- Radii: 12/10/8
- Typography scale: iOS-like hierarchy (Large Title, Title, Headline, Body, etc.)
- Tap targets: minimum 44x44 for interactive elements

### Custom Components

The ultra-minimal direction (Direction 5) + our journeys require custom components that encode product-specific UX rules.

#### Scan Flow

### `ScanCameraFrame`

**Purpose:** camera-first scanning with calm guidance  
**Usage:** Scan screen primary area  
**Anatomy:** camera view + subtle guide frame + optional hint text + timer-to-fallback affordance  
**States:** scanning, success (transition), low-confidence, permission-denied  
**Variants:** torch on/off, dark/light  
**Accessibility:** clear fallback action; avoid blamey error messaging  
**Interaction Behavior:** after ~5s show fallback prompt (manual entry + recent scans)

### `FallbackPrompt`

**Purpose:** one-tap recovery when scan stalls  
**Content:** short reassurance + “Enter barcode” primary action + “Recent scans” secondary  
**States:** shown/hidden; empty recent list  
**Interaction:** opens `BarcodeEntrySheet`

### `BarcodeEntrySheet`

**Purpose:** manual entry path without breaking calm flow  
**Content:** barcode input + “Go” + recent scans list  
**States:** invalid barcode inline error; no recent scans empty state  
**Accessibility:** numeric keyboard; clear error message

#### Results Flow

### `ProductIdentityHeader`

**Purpose:** reduce doubt by making item identity obvious  
**Content:** product name (primary), barcode + “last scanned”/timestamp (secondary)  
**States:** known name, unknown name (“Unnamed product” + edit affordance)  
**Interaction:** optional “Edit name” secondary action

### `StorePriceRow`

**Purpose:** stable, scannable per-store row  
**Content:** store name, price OR Missing, captured timestamp (secondary)  
**States:** priced, missing, stale (optional), pressed  
**Variants:** cheapest subtle highlight (optional)  
**Accessibility:** row is tappable; state is not color-only

### `AddPriceSheet`

**Purpose:** fast offline capture for Missing  
**Content:** store, product name (if missing), price input, captured timestamp auto, Save  
**States:** validation errors, saving, saved toast  
**Interaction:** Save updates Results instantly (offline-first)

#### Stores & List

### `StoreRow`

**Purpose:** add/edit store + toggle active  
**Content:** store name, active switch  
**States:** active/inactive  
**Accessibility:** switch label and row tap targets

### `ShoppingListItemRow`

**Purpose:** simple list-first behavior  
**Content:** product name, qty, checked=in-cart  
**States:** checked/unchecked, qty changes  
**Interaction:** dedupe by barcode; increment quantity on duplicate add

### Component Implementation Strategy

- Use Tamagui primitives + theme tokens for all screens to keep the calm iOS-like feel consistent.
- Keep one primary CTA per screen (Direction 5), with contextual actions via row-tap / sheets.
- Prefer `Sheet` for Add Price / Barcode entry to preserve context and one-handed flow.
- Standardize states:
  - Missing is neutral + actionable (not “error red”)
  - Save confirmation is subtle (toast)
  - Permission denied routes to manual entry path

### Implementation Roadmap

**Phase 1 — Core loop (must ship)**

- `ScanCameraFrame`, `FallbackPrompt`, `BarcodeEntrySheet`
- `ProductIdentityHeader`, `StorePriceRow`, `AddPriceSheet`
- `StoreRow` (gating: require ≥1 active store)
- `ShoppingListItemRow`

**Phase 2 — Trust + polish**

- stale indicators (subtle)
- “Saved” toast standardization
- empty states: no recent scans, no prices yet

**Phase 3 — Nice-to-haves**

- cheapest highlight (subtle)
- current-store pinning (if you decide to add it later)

## UX Consistency Patterns

### Button Hierarchy

**Goal:** Maintain an ultra-minimal, calm UI with one clear primary action, while keeping secondary actions discoverable without clutter.

#### Primary Actions

**When to use:**

- The single most important next step on a screen (e.g., “Add to list” on Results).
- Core completion actions inside sheets (e.g., “Save” in Add Price).

**Visual design:**

- Accent-tinted primary button (Grocery Green).
- Full-width on mobile when it’s the only primary action; otherwise prominent within a sheet/footer.

**Behavior:**

- Always enabled only when requirements are met; otherwise show clear inline reason (not vague disabled).
- Tap feedback is immediate (pressed state + optional subtle haptic on key actions like Save).

#### Secondary Actions

**When to use:**

- Non-critical or alternate paths (e.g., “Recent scans”, “Edit name”, “Cancel”).
- Actions that support recovery but shouldn’t compete with the primary.

**Visual design:**

- Neutral button style (surface + border), smaller visual weight than primary.
- Prefer placing secondary actions as:
  - navigation bar items (Cancel/Back), or
  - contextual actions (row tap), or
  - within a sheet (not floating on the main screen).

**Behavior:**

- Should never be required to complete the core loop; keep the main path obvious.

#### Contextual Actions (Ultra-minimal pattern)

**Rule:** Prefer “tap the thing to act on it” over adding extra buttons.

- Tap Missing store row → Add Price sheet (primary contextual action).
- Tap priced store row → Edit Price (secondary contextual action).
- Tap product identity area or overflow → Edit name (secondary).

### Navigation Model Update

- Primary tabs: Home, Stores, Scan, Shopping (Shopping may be placeholder pre-Epic 3).
- Results is a flow destination, not a tab.
- Add Price is a contextual sheet/route, only reachable from Results.

### Guarding & Gating

- Results requires barcode context; if missing, route back to Scan with clear CTA.
- Add Price requires store + barcode context; otherwise redirect safely.

### Home Screen Guidance

- Remove debug route list.
- Home presents a primary CTA to Scan and secondary access to Stores/Shopping.
- Copy aligns with calm, minimal voice.

This keeps screens calm while still making actions available.

#### Destructive Actions

**When to use:**

- Remove store, clear list, delete price (if supported).

**Visual design:**

- Never use destructive red as a primary CTA on main screens.
- Place destructive actions behind a secondary path (sheet/menu) with confirmation.

**Behavior:**

- Require confirmation for destructive actions that lose data.

#### Labels & Tone

- Use short, clear labels in sentence case: “Add to list”, “Add price”, “Enter barcode”, “Save”.
- Avoid blame language: error/recovery text should be situational (“Barcode may be damaged”).

#### Accessibility

- Minimum tap targets 44x44.
- Don’t rely on color alone: button role should be clear via position, shape, label, and hierarchy.
- Provide clear pressed/focus states for all actions.

## Responsive Design & Accessibility

### Responsive Strategy

**MVP target:** Phone-only (iOS + Android)

**Baseline devices**

- Compact target: iPhone SE (3rd gen)
- Android sanity: Pixel 6a

**Layout approach**

- Mobile-first, single-column layouts everywhere.
- Optimize for one-handed reach (primary actions near bottom; avoid top-heavy controls).
- Support both portrait and landscape; do not rely on landscape for core flows.

**Two density modes (not breakpoints)**

- `regular`: default for most phones
- `compact`: iPhone SE class and/or large Dynamic Type

What can change by mode:

- padding / gaps / row height (via tokens)
- wrapping rules and minor typography adjustments (within the type scale)

What must not change:

- information architecture and interaction model (Direction 5 stays Direction 5)

**Dynamic Type-first**

- Product name can wrap (avoid ambiguity).
- Store names can wrap or truncate safely (never into confusion).
- Barcode + timestamp are always present but secondary (may wrap to a new line).

### Breakpoint Strategy

React Native adaptation is behavioral rather than px breakpoints:

- Use `compact` vs `regular` density driven by device class and accessibility text size.
- Do not introduce multi-column layouts in MVP.

### Accessibility Strategy (Target: WCAG AA)

**Core requirements**

- Touch targets ≥ 44x44.
- Text contrast meets AA in both Light and Dark themes.
- Don’t rely on color alone for “Missing vs Price” (use labels + hierarchy).
- Support Dynamic Type / font scaling for core text.

**Screen reader support**

- Store rows announce in one accessible label:
  - store name
  - state: price or missing
  - captured time (e.g., “captured 2 days ago”)

**Camera permission denied**

- If camera permission is denied, route to manual entry + recent scans (still reaches Results).
- This path must be fully usable with VoiceOver/TalkBack.

**Sheets + focus management**

- Opening `BarcodeEntrySheet` focuses barcode input.
- Opening `AddPriceSheet` focuses price input (or name if missing).
- Closing a sheet returns focus to the originating row/button when possible.

### Testing Strategy

**Device + layout**

- iPhone SE (3rd gen) + Pixel 6a
- portrait + landscape
- large Dynamic Type enabled (stress test Results clarity)

**Accessibility**

- VoiceOver (iOS) + TalkBack (Android):
  - must complete: Scan → fallback → Results → Add Price → Save
- Contrast checks for Light/Dark themes (especially accent green on surfaces)
- Tap target audit (44x44) for rows, torch, overflow, and sheet buttons

### Implementation Guidelines

- Use Tamagui tokens consistently for spacing/type/color; avoid ad-hoc sizes.
- Ensure every tappable row/button has an accessible label and role.
- Keep recovery copy calm and non-blaming (“barcode may be damaged/unscannable”).
