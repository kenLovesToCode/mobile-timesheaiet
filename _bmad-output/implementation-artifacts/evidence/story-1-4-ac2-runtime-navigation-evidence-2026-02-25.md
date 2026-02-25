# Story 1.4 AC2 Runtime Navigation Evidence (iOS Simulator)

Date: 2026-02-25
Story: `1-4-app-shell-and-navigation-scaffold`
Acceptance Criterion: AC2 (Expo Router route transitions work without errors)

## Environment

- Device: `iPhone 17 Pro` simulator
- OS: `iOS 26.2`
- App container: Expo Go
- Metro command: `CI=1 npx expo start --clear --port 8083`

## Route Traversal Commands

The following deep-link commands were used against a booted simulator:

- `xcrun simctl openurl booted exp://127.0.0.1:8083/--/`
- `xcrun simctl openurl booted exp://127.0.0.1:8083/--/stores`
- `xcrun simctl openurl booted exp://127.0.0.1:8083/--/scan`
- `xcrun simctl openurl booted exp://127.0.0.1:8083/--/results`
- `xcrun simctl openurl booted exp://127.0.0.1:8083/--/add-price`
- `xcrun simctl openurl booted exp://127.0.0.1:8083/--/shopping-list`

## Observed Results

- App launched and resolved Expo Router routes without runtime exceptions.
- Each primary Story 1.4 placeholder route rendered successfully during traversal.
- Metro logs showed no route-transition runtime errors while opening the routes above.

## Notes

- Screenshots were captured during the validation run for spot-checking route rendering, but screenshot file paths were transient (`/tmp`).
- This artifact records the durable command sequence and observed results for review/audit purposes.
