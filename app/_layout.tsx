import { Stack } from 'expo-router/stack';

import { AppTamaguiProvider } from '../src/ui/tamagui-provider';
import { DatabaseBootstrapGate } from '../src/db/bootstrap-gate';

export default function RootLayout() {
  const isDev = __DEV__;

  return (
    <AppTamaguiProvider>
      <DatabaseBootstrapGate>
        <Stack
          screenOptions={{
            animation: 'default',
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen name="index" options={{ title: 'PriceTag Home' }} />
          <Stack.Screen name="stores" options={{ title: 'Stores' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan' }} />
          <Stack.Screen name="results" options={{ title: 'Results' }} />
          <Stack.Screen name="add-price" options={{ title: 'Add Price' }} />
          <Stack.Screen name="shopping-list" options={{ title: 'Shopping List' }} />
          {isDev ? (
            <Stack.Screen name="dev/device-smoke" options={{ title: 'Device Smoke' }} />
          ) : null}
        </Stack>
      </DatabaseBootstrapGate>
    </AppTamaguiProvider>
  );
}
