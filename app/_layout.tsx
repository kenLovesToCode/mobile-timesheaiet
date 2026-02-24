import { Stack } from 'expo-router/stack';

import { AppTamaguiProvider } from '../src/ui/tamagui-provider';
import { DatabaseBootstrapGate } from '../src/db/bootstrap-gate';

export default function RootLayout() {
  return (
    <AppTamaguiProvider>
      <DatabaseBootstrapGate>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'PriceTag' }} />
        </Stack>
      </DatabaseBootstrapGate>
    </AppTamaguiProvider>
  );
}
