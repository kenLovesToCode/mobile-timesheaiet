# Story 1.4 AC3 Android Runtime Layout Evidence (Physical Device, User-Observed Support)

Date: 2026-02-25
Story: `1-4-app-shell-and-navigation-scaffold`
Acceptance Criterion: AC3 (base layout respects safe areas and renders consistently across iOS and Android)

## Environment

- Device: Android physical device (model not recorded in this run)
- Connection: Wi-Fi (Expo Go LAN connection)
- Metro port: `8084`
- Launch mode: Expo Go opened via `exp://<LAN-IP>:8084`

## Route Traversal Scope (User-Observed)

User reported completing the Story 1.4 primary route traversal checks on Android after connecting Expo Go over Wi-Fi:

- `/`
- `/stores`
- `/scan`
- `/results`
- `/add-price`
- `/shopping-list`

## Observed Results

- No runtime error logs were reported during Android physical-device validation.
- Story 1.4 shell navigation and placeholder route rendering completed without observed route-transition failures.
- Validation provides supporting AC3 cross-platform confidence in combination with existing iOS simulator evidence and shared safe-area scaffold implementation.
- This artifact is user-observed runtime support evidence (not a route-by-route logged proof artifact) because device model/OS and route-specific layout screenshots/logs were not captured in this run.

## Console Log Snippet (User-Reported)

```text
LOG  [db] Dev smoke create/read succeeded {"id": "dev-smoke-record-1772031812502", "label": "SQLite + Drizzle ready"} {"createdAt": 1772031812504, "id": "dev-smoke-record-1772031812502", "label": "SQLite + Drizzle ready"}
LOG  [db] Dev smoke invalid payload rejected Invalid dev smoke payload: label is required
```

## Notes

- The reported logs are from dev smoke/database checks and indicate the app was running on the Android device; they are included as corroborating runtime evidence from the same validation session.
- Device model/Android OS version were not captured in this artifact and should be included in future validation runs for stronger audit detail.
- Future AC3 evidence should also capture route-specific safe-area screenshots (or equivalent logs) for at least home + one placeholder route on Android.
