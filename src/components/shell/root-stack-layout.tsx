import type { ReactNode } from 'react';
import { Stack } from 'expo-router/stack';

import { DatabaseBootstrapGate } from '../../db/bootstrap-gate';
import { AppTamaguiProvider } from '../../ui/tamagui-provider';

type RootStackLayoutProps = {
  children?: ReactNode;
};

export function RootStackLayout({ children }: RootStackLayoutProps) {
  return (
    <AppTamaguiProvider>
      <DatabaseBootstrapGate>
        <Stack
          screenOptions={{
            animation: 'default',
            headerTitleAlign: 'center',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="results" options={{ title: 'Results' }} />
          <Stack.Screen name="add-price" options={{ title: 'Add Price' }} />
          {children}
        </Stack>
      </DatabaseBootstrapGate>
    </AppTamaguiProvider>
  );
}
