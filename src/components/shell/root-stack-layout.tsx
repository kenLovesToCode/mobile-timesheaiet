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
          <Stack.Screen name="index" options={{ title: 'PriceTag Home' }} />
          <Stack.Screen name="stores" options={{ title: 'Stores' }} />
          <Stack.Screen name="scan" options={{ title: 'Scan' }} />
          <Stack.Screen name="results" options={{ title: 'Results' }} />
          <Stack.Screen name="add-price" options={{ title: 'Add Price' }} />
          <Stack.Screen name="shopping-list" options={{ title: 'Shopping List' }} />
          {children}
        </Stack>
      </DatabaseBootstrapGate>
    </AppTamaguiProvider>
  );
}
