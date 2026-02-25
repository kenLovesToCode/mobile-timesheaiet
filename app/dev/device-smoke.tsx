import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

let DeviceSmokeScreen: ComponentType | null = null;

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  DeviceSmokeScreen = require('../../src/dev/device-smoke-screen').DeviceSmokeScreen;
}

export default function DeviceSmokeRoute() {
  if (!__DEV__ || !DeviceSmokeScreen) {
    return <Redirect href="/" />;
  }

  return <DeviceSmokeScreen />;
}
