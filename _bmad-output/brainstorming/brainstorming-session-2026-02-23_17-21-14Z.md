---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: "Price Tag App"
session_goals: "Scan products per grocery store (camera/barcode), show price immediately per store/in-store, compare prices across stores, plan shopping in advance (compute totals), maintain a buy list, and track items added to cart."
selected_approach: "ai-recommended"
techniques_used:
  ["Question Storming", "Solution Matrix", "Reverse Brainstorming"]
ideas_generated: [28]
context_file: ""
technique_execution_complete: true
session_active: false
workflow_completed: true
---

# Brainstorming Session Results

**Facilitator:** sensei
**Date:** 2026-02-23T17:21:14Z

## Session Overview

**Topic:** Price Tag App
**Goals:** Scan products per grocery store (camera/barcode), show price immediately per store/in-store, compare prices across stores, plan shopping in advance (compute totals), maintain a buy list, and track items added to cart.

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** 45 minutes, MVP focus

**Recommended Techniques:**

- **Question Storming (Deep):** Surface hidden unknowns (price source, store identity, product variants, trust) and prioritize what must be answered to ship an MVP.
- **Solution Matrix (Structured):** Turn key variables (scan method, price source, store mapping, list/cart flow, comparison rules) into a grid to pick the simplest viable combination.
- **Reverse Brainstorming (Creative):** Identify trust-killers and failure modes (wrong price/store, stale data, duplicates) to define MVP guardrails and mitigations.

## Technique Execution (In Progress)

### Question Storming (Questions Only)

**[Question Cluster #1]**: Scan Capture Flow
_Concept_: How do we guide the user to “focus on the barcode” (overlay, auto-focus, haptics)? What’s the max time before we offer a fallback? What is the fallback flow when scan fails (manual entry, pick from history)?
_Novelty_: Treats “scan” as a timed interaction with graceful escape hatches, not a single happy-path feature.

**[Question Cluster #2]**: Barcode Scope (MVP)
_Concept_: Are we strictly 1D (UPC/EAN) for MVP? If a barcode is partially readable, do we attempt correction or always fall back to manual entry? Do we support scanning multiple items quickly (batch) or one-at-a-time only?
_Novelty_: Constrains scope explicitly while still addressing speed/throughput as a first-class MVP concern.

**[Question Cluster #3]**: Store Context Selection
_Concept_: Is store selection always manual? Can the user pre-select “active stores” before scanning (one store vs multiple)? What’s the minimum taps from opening camera to being in the correct store context?
_Novelty_: Frames store identity as a UX prerequisite that determines data correctness.

**[Question Cluster #4]**: Product Match & Identity
_Concept_: When a barcode is scanned, what exactly must match in the database (UPC/EAN only, or UPC+brand+size)? How do we handle multiple products mapping to the same code (or vice versa)? What’s the confirmation UI before showing a price?
_Novelty_: Focuses on avoiding “false certainty” by defining identity and confirmation.

**[Question Cluster #5]**: Variants & “Use the Best”
_Concept_: What does “use the best” mean for variants: most recent, cheapest, highest confidence, closest size, or user-picked default? How do we represent size/unit so comparisons are fair (price per unit)? What’s the UI when the app detects multiple plausible matches?
_Novelty_: Turns an ambiguous requirement into testable rules and UI states.

**[Question Cluster #6]**: Price Capture When Missing
_Concept_: If lookup fails, what is the “add it” flow (add product, add price, add both)? What fields are required for a valid price entry (store, price, currency, unit/size, timestamp)? How do we prevent accidental bad data entry?
_Novelty_: Designs the “missing data” path as the default growth mechanism, not an exception.

**[Question Cluster #7]**: Trust & Timestamp
_Concept_: Where do we show timestamp and source so users trust the price? Do we show “stale” warnings (e.g., older than X days)? Can a user override/edit a price and how do we track that history?
_Novelty_: Treats trust UX as part of the core feature, not polish.

**[Question Cluster #8]**: Offline-First + Sync Later
_Concept_: What must work fully offline (scan, lookup, add product/price, list/cart)? How do we resolve conflicts when syncing later (two prices for same product/store)? What’s the “best” offline caching strategy for speed vs storage?
_Novelty_: Makes offline constraints drive the data model and conflict rules from day one.

**Selected “Questions Only” Set (Variants + Offline-First):**

A) Variants + “use the best”

1. If multiple sizes share a brand/name, how do we confirm the exact variant after scan?
2. What does “best price” mean: most recent, cheapest, highest confidence, or user-chosen default?
3. Do we store and compare price-per-unit (e.g., per oz/kg) for fairness?
4. What do we show when the barcode matches multiple items in our DB?
5. Can users merge/override incorrect matches, and how do we prevent repeats?

B) Offline-first + sync 6. What must work fully offline: scan, lookup, add price, list/cart, comparisons? 7. When offline, where does lookup come from: local DB only, or cached “active stores” data? 8. On sync, how do we resolve conflicts (two different prices for same product+store)? 9. Do we keep price history per store (and how many entries), or only latest? 10. How do we handle a price that’s “too old” (stale threshold + warning)?

**Selected “Questions Only” Set (Trust + Data Quality):**

1. If a user updates a price, do we keep history + who/when, or overwrite?
2. How do we handle sales/discounts vs regular price (tag it, or ignore for MVP)?
3. How do we prevent a single user from “poisoning” prices for a store/product?
4. When comparing stores, do we compare exact same variant, or allow “closest match”?

### Solution Matrix (Up Next)

_Goal_: Select the simplest MVP combination across store context, product identity, price source, offline behavior, and list/cart flow.

**Matrix Decision (MVP):** Multi-store compare (scan shows prices for selected stores).
**Matrix Decision (MVP):** Preselect “active stores” (compare against a user’s saved store set).
**Matrix Decision (MVP):** Instant results screen after scan (product + per-active-store price or “missing”).
**Matrix Decision (MVP):** Barcode-only product identity (assume barcode uniquely identifies product).
**Matrix Decision (MVP):** User-entered prices only (per store; prompt to add when missing).
**Matrix Decision (MVP):** Missing price flow = results screen → select store → add price (timestamp auto).
**Matrix Decision (MVP):** Offline-first = all core data local-first (products, prices, lists, carts) with optional sync later.
**Matrix Decision (MVP):** Single shopping list with checked items (checked = in cart).
**Matrix Decision (MVP):** Comparison = exact matches only (same barcode) across stores.

### Reverse Brainstorming (Up Next)

_Goal_: Generate ways the MVP could fail spectacularly (trust, wrong-store, duplicates, stale data, UX friction) to extract concrete guardrails.

## Reverse Brainstorming (Failures)

**[Category #1]**: Barcode Blindspot
_Concept_: Scanner fails frequently in real store lighting (glare, curved packaging), so shoppers give up before the app delivers value.
_Novelty_: Treats environmental variability as the core enemy, not a rare edge case.

**[Category #2]**: False Match Confidence
_Concept_: Scanner “successfully” reads a barcode but maps to the wrong product in the local DB, showing a confident-looking price for the wrong item.
_Novelty_: Highlights that “wrong but confident” is more damaging than “can’t find it”.

**[Category #3]**: Wrong Store Context
_Concept_: The active-store set is wrong (user forgot to update it) and the app compares stores the shopper isn’t at, making results feel irrelevant.
_Novelty_: Failure isn’t accuracy—it’s relevance at the moment of use.

**[Category #4]**: Missing Price Wall
_Concept_: Most scans show “missing” for most stores, turning the experience into constant data entry instead of quick lookup.
_Novelty_: Defines “coverage” as the true MVP success metric, not features.

**[Category #5]**: Stale Price Trap
_Concept_: Prices are old but still displayed as if current; users get surprised at checkout and stop trusting the app.
_Novelty_: Trust decays invisibly unless staleness is made explicit.

**[Category #6]**: Manual Entry Damage
_Concept_: When scan fails and users type the barcode/price, typos create bad data that spreads through comparisons later.
_Novelty_: The fallback path becomes the primary source of corruption.

**[Category #7]**: Unit/Variant Confusion
_Concept_: Two “similar” products (different size/pack) share a name vibe; users assume the comparison is fair but it isn’t without unit/variant clarity.
_Novelty_: The app “works” but misleads—quietly.

**[Category #8]**: Offline Friction
_Concept_: Offline-first is promised, but key flows feel blocked (no lookup results, slow local search, can’t add quickly), so in-store usage breaks.
_Novelty_: Offline failure can look like “the app is dumb” rather than “the network is down”.

**[Category #9]**: One-Hand UX Fail
_Concept_: In-store shoppers have one hand busy; if scan → results → add price → add to list takes too many taps, they abandon mid-aisle.
_Novelty_: Physical context (one-handed, rushed) is the constraint that kills adoption.

**[Category #10]**: Battery/Heat Penalty
_Concept_: Camera + scanning drains battery or overheats devices, so users avoid using it for a full grocery trip.
_Novelty_: Performance becomes a trust issue (“this app hurts my phone”).

**User Emphasis:** Curved packaging is common in real grocery trips, so scan reliability on curved surfaces is a primary risk.

**[Category #11]**: Curvature Distortion Loop
_Concept_: Barcode lines warp on bottles/cans so the scanner “hunts” (re-focuses, re-frames) and times out, making the app feel unreliable mid-aisle.
_Novelty_: Failure is not just “can’t scan” — it’s repeated micro-failures that train the user to quit.

**[Category #12]**: Glare + Reflection False Reads
_Concept_: Shiny curved packaging introduces glare; the scanner occasionally reads the wrong digits (or partially reads), creating incorrect product matches.
_Novelty_: Intermittent wrong reads create a “sometimes lies” reputation.

**[Category #13]**: Wrinkle/Seam Occlusion
_Concept_: Shrink-wrap seams, creases, or label edges hide part of the barcode; user retries multiple times and abandons.
_Novelty_: Packaging geometry becomes a systematic blocker in high-volume shopping contexts.

### Extracted Guardrails (From Curved Packaging Failures)

**[Category #G1]**: Angle Coach
_Concept_: Real-time guidance (“tilt left/right”, “move closer/farther”, “turn on flash”) plus a strong scan box overlay optimized for 1D.
_Novelty_: Treats scanning like a coached skill, not a passive camera feature.

**[Category #G2]**: Fast Fallback Path
_Concept_: After ~3 seconds, offer one-tap fallback: manual barcode entry + “recent scans” list to avoid aisle-stall.
_Novelty_: Optimizes for shopper speed under real constraints (one hand, time pressure).

**[Category #G3]**: Confidence + Confirm When Low
_Concept_: If scan confidence is low or digits are ambiguous, show a lightweight confirmation state (product name/size) before displaying prices.
_Novelty_: Prevents “wrong but confident” outcomes without slowing the happy path.

**Guardrails Chosen (MVP Priority):** Angle Coach + Fast Fallback Path

**[Category #14]**: Missing Price Wall (User-Reported)
_Concept_: After scanning, most stores show “missing”, so the app feels like busywork and data entry rather than a helpful in-aisle assistant.
_Novelty_: The MVP fails on coverage, not capability.

**[Category #15]**: Shopping List Mistakes (User-Reported)
_Concept_: Users end up with duplicates, wrong quantities, or can’t tell what’s already “in cart” (checked), causing frustration mid-trip.
_Novelty_: The list/cart model becomes a source of errors, not relief.

### Extracted Guardrails (From Non-Scan Failures)

**[Category #G4]**: Coverage Nudges
_Concept_: Make “missing” actionable: one-tap add price for a specific store, and a gentle progress indicator (“2/5 stores have prices”) to reward contribution.
_Novelty_: Turns missing data into a lightweight micro-task instead of a dead end.

**[Category #G5]**: List Integrity
_Concept_: Prevent duplicates by default (merge on barcode), support quick quantity adjust, and add a clear checked-state summary (“3 in cart”).
_Novelty_: Reduces cognitive load for one-handed, in-aisle usage.

## Idea Organization and Prioritization

### Thematic Organization

**Theme 1: MVP Core Flow (Shopper In-Aisle)**

- Multi-store compare against preselected “active stores”
- Scan → instant results screen (product + per-store price/missing)
- User-entered prices; inline add price from results screen; timestamp auto
- Offline-first local storage; exact-barcode match comparisons
- Single shopping list (checked = in cart)

**Theme 2: Scan Reliability (Curved Packaging Reality)**

- Failure modes: curvature distortion loops, glare false reads, seams/wrinkles occlusion
- Guardrails: angle coach + fast fallback (manual entry + recent scans)

**Theme 3: Data + Trust**

- “Wrong but confident” is a top risk; ambiguity needs safer UX
- Trust questions to resolve: edit history, sales/discount tagging, poisoning prevention
- Staleness must be visible (timestamp + stale warning policy)

**Theme 4: Coverage Growth**

- Missing price wall risk
- Guardrails: make “missing” actionable + progress nudges (“2/5 stores priced”)

### Prioritization Results

**Top Priorities (Selected):**

1. **Scan reliability UX** (angle coach + fallback)
2. **Results screen + multi-store compare**

### Action Planning

**Priority 1: Scan Reliability UX (Angle Coach + Fallback)**

- **This week:**
  1. Design scan overlay states: idle → detecting → success → fail/timeout.
  2. Define timeout rule (e.g., ~3 seconds) and fallback CTA (manual entry + recent scans).
  3. Add scan UX acceptance criteria: one-handed use, low light, curved packaging.
- **Success indicators:** High “scan success or graceful fallback” completion rate; low rage-quit behavior (users not stuck in camera).

**Priority 2: Results Screen + Multi-Store Compare**

- **This week:**
  1. Define results screen layout: product header + list of active stores with price/missing + timestamp.
  2. Define “active stores” management entry point and default state (first run).
  3. Define per-store row actions: add/edit price; show stale badge if needed.
- **Success indicators:** Fast time from scan → decision; users can act on missing prices without leaving the flow.

## Session Summary and Insights

**Key Achievements:**

- Clear MVP decisions via Solution Matrix (multi-store compare + active stores + instant results + offline-first + user-entered prices).
- Identified top adoption risk: scan reliability on curved packaging.
- Converted major failure modes into concrete guardrails (angle coaching, fast fallback, coverage nudges, list integrity).
