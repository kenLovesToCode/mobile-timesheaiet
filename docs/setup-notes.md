# priceTag Setup Notes

## Environment Requirements

- Node.js: Use an Expo SDK 55-supported Node.js version (validated locally on `24.13.1` for this story)
- npm: Use npm for this repo workflow (`package-lock.json` is authoritative; validated locally on `11.8.0`)
- Yarn: not applicable for this repo workflow (npm is authoritative via `package-lock.json`; if used for tooling inspection only, use Yarn 4.1+)

## Install and Run

```bash
npm install
npm run start
```

## Validation Scripts

```bash
npm run typecheck
npm run lint
npm run check:expo-config
npm run build
```

## Platform Smoke Check (Manual)

- iOS: `npm run ios`
- Android: `npm run android`
- Confirm the initial `PriceTag` screen renders with the Tamagui heading and placeholder copy (no interactive button yet).

## Notes

- Tamagui was integrated into the existing Expo Router starter (no template re-initialization).
- The architecture doc mentions Yarn for the Tamagui template flow, but this project uses npm successfully after manual integration.
- Expo SDK 55 dependencies are intentionally on preview packages in this story (`expo@55.0.0-preview.12`, `expo-router@55.0.0-preview.9`) as a temporary alignment exception until stable SDK 55 package versions are adopted (preview versions are pinned exactly for reproducible installs).
- `npm run build` exports web + iOS + Android bundles to validate cross-platform bundling/config regressions in one command.
- If Android (or iOS) reload/bundling hangs after config or entry-file changes, restart Metro with a cache reset: `npx expo start -c` (this resolved a post-change Android reload hang during Story 1.1 validation).
