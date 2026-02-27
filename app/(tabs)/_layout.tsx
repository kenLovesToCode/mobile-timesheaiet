import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

type TabRouteName = 'index' | 'stores' | 'scan' | 'shopping-list' | 'products';

type TabIconPair = {
  active: ComponentProps<typeof Ionicons>['name'];
  inactive: ComponentProps<typeof Ionicons>['name'];
};

export const TAB_ICON_NAMES: Record<TabRouteName, TabIconPair> = {
  index: { active: 'home', inactive: 'home-outline' },
  stores: { active: 'business', inactive: 'business-outline' },
  scan: { active: 'scan', inactive: 'scan-outline' },
  'shopping-list': { active: 'cart', inactive: 'cart-outline' },
  products: { active: 'cube', inactive: 'cube-outline' },
};

function createTabOptions(routeName: TabRouteName, title: string) {
  return {
    title,
    tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <Ionicons
        color={color}
        name={focused ? TAB_ICON_NAMES[routeName].active : TAB_ICON_NAMES[routeName].inactive}
        size={size}
      />
    ),
  };
}

export default function PrimaryTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a84ff',
        tabBarInactiveTintColor: '#8a8a8e',
      }}
    >
      <Tabs.Screen name="index" options={createTabOptions('index', 'Home')} />
      <Tabs.Screen name="stores" options={createTabOptions('stores', 'Stores')} />
      <Tabs.Screen name="scan" options={createTabOptions('scan', 'Scan')} />
      <Tabs.Screen name="shopping-list" options={createTabOptions('shopping-list', 'Shopping')} />
      <Tabs.Screen name="products" options={createTabOptions('products', 'Products')} />
    </Tabs>
  );
}
