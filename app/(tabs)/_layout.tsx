import { Tabs } from 'expo-router';

export default function PrimaryTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="stores" options={{ title: 'Stores' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="shopping-list" options={{ title: 'Shopping' }} />
    </Tabs>
  );
}
