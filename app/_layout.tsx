import { Stack } from 'expo-router/stack';

import { RootStackLayout } from '../src/components/shell/root-stack-layout';

export default function RootLayout() {
  return (
    <RootStackLayout>
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="dev/device-smoke" options={{ title: 'Device Smoke' }} />
      </Stack.Protected>
    </RootStackLayout>
  );
}
