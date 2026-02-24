import { Stack } from 'expo-router/stack';

import { AppTamaguiProvider } from '../src/ui/tamagui-provider';

export default function RootLayout() {
  return (
    <AppTamaguiProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'PriceTag' }} />
      </Stack>
    </AppTamaguiProvider>
  );
}
