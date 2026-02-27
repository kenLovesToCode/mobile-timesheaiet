# Story 3.3 Shopping List Open-Time Evidence

Date: 2026-02-27  
Story: 3-3-check-items-in-cart-and-view-list  
Acceptance Criteria: AC2 (Shopping List visible within 1.0s P95)

## Measurement Method

- Instrumented Shopping List open-to-visible flow in `src/features/shopping-list/shopping-list-performance.ts`.
- Open marker is captured only for focus/open loads in `ShoppingListFeatureScreen` (`trackOpenMeasurement: true` on focus).
- Completion marker is recorded on the first committed ready-state layout (`onLayout` on `shopping-list-ready-container`) before storing an open sample.
- Non-open refresh paths (retry/error recovery) do not contribute to open-time samples.
- P95 summary is computed from runtime samples recorded through screen rendering (`getShoppingListOpenSummary`).
- In-app evidence logging now scopes to a session window (`sessionSinceMeasuredAtMs`) so older samples cannot silently skew current evidence captures.

## Instrumentation Harness Context (Non-Representative)

- Evidence run from runtime screen-flow harness in `__tests__/story-3-3-shopping-list-performance.test.js`.
- The test mounts the Shopping List screen repeatedly, waits for visible rows, fires ready-layout commit events, and validates open-to-visible p95 against budget from recorded instrumentation samples.
- Test also verifies retry refreshes do not pollute open-time metrics.
- Current harness sample size: **n=25**.
- This harness validates instrumentation correctness only; representative-device acceptance is decided from runtime in-app capture below.

## Representative-Device Runtime Capture

- Runtime capture received from in-app `Log open performance` JSON payload:
  - Captured at: `2026-02-27T12:05:19.082Z`
  - Device: `iPhone 17 Pro Max`
  - OS: `iOS 26.2`
  - Build/profile: `Expo Go`
  - Event mix: `cold=10`, `warm=16`, `focus=15`
  - Count: `41`
  - P95: `12.256165999919176 ms`
  - Max: `31.611291999928653 ms`
  - Budget: `<= 1000 ms`
  - Outcome: **PASS**
- Raw sample list included in log payload (`samples[]`, 41 entries).

## Result

- Representative-device count: 41 runtime open samples
- Representative-device P95: 12.2562 ms
- Budget: <= 1000 ms
- Outcome: PASS on captured runtime data

## Commands Executed

- `npx jest __tests__/story-3-3-shopping-list-performance.test.js --runInBand --watchman=false`
