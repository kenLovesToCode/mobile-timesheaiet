/* eslint-env jest */

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const React = require('react');
  const { View } = require('react-native');

  return {
    ...actual,
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('tamagui', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  const TextStub = ({ children, ...props }) => React.createElement(Text, props, children);
  const ViewStub = ({ children, ...props }) => React.createElement(View, props, children);

  return {
    createTokens: (tokens) => tokens,
    createFont: (font) => font,
    createTamagui: (cfg) => cfg,
    H1: TextStub,
    H2: TextStub,
    Paragraph: TextStub,
    YStack: ViewStub,
    TamaguiProvider: ViewStub,
    Theme: ViewStub,
    useTheme: () => ({
      background: { val: '#f2f7f3' },
      borderColor: { val: '#cccccc' },
      color: { val: '#1c1c1e' },
      placeholderColor: { val: '#6d6d72' },
      surface: { val: '#ffffff' },
      textPrimary: { val: '#1c1c1e' },
      textSecondary: { val: '#6d6d72' },
      accentBackground: { val: '#34c759' },
      accentBorderColor: { val: '#34c759' },
      accentColor: { val: '#ffffff' },
      danger: { val: '#ff3b30' },
      warning: { val: '#ffcc00' },
      shadowColor: { val: '#00000022' },
    }),
  };
});

describe('Story 4.1 primary navigation shell', () => {
  const previousFeatureFlag = process.env.EXPO_PUBLIC_ENABLE_SHOPPING_LIST;

  afterEach(() => {
    if (previousFeatureFlag === undefined) {
      delete process.env.EXPO_PUBLIC_ENABLE_SHOPPING_LIST;
      return;
    }

    process.env.EXPO_PUBLIC_ENABLE_SHOPPING_LIST = previousFeatureFlag;
  });

  beforeEach(() => {
    jest.resetModules();
    delete process.env.EXPO_PUBLIC_ENABLE_SHOPPING_LIST;
  });

  it('defines Home, Stores, Scan, and Shopping tabs in order without Results (AC1, AC2)', () => {
    const React = require('react');
    const { TAB_ICON_NAMES, default: TabsLayoutRoute } = require('../app/(tabs)/_layout');
    const routeElement = TabsLayoutRoute();
    const tabScreens = React.Children.toArray(routeElement.props.children);
    const tabNames = tabScreens.map((screen) => screen.props.name);
    const tabTitles = tabScreens.map((screen) => screen.props.options?.title);
    const tabIconFunctions = tabScreens.map((screen) => screen.props.options?.tabBarIcon);
    const iconContracts = tabNames.map((tabName) => TAB_ICON_NAMES[tabName]);

    expect(tabNames).toEqual(['index', 'stores', 'scan', 'shopping-list']);
    expect(tabTitles).toEqual(['Home', 'Stores', 'Scan', 'Shopping']);
    expect(tabNames).not.toContain('results');
    expect(tabIconFunctions.every((iconFn) => typeof iconFn === 'function')).toBe(true);
    expect(iconContracts).toEqual([
      { active: 'home', inactive: 'home-outline' },
      { active: 'business', inactive: 'business-outline' },
      { active: 'scan', inactive: 'scan-outline' },
      { active: 'cart', inactive: 'cart-outline' },
    ]);
  });

  it('routes to shopping list feature when feature is enabled (AC3)', () => {
    jest.isolateModules(() => {
      const shoppingModule = require('../src/features/shopping-list/shopping-list-screen');
      const ShoppingRoute = require('../app/(tabs)/shopping-list').default;
      const routeElement = ShoppingRoute();

      expect(routeElement.type).toBe(shoppingModule.ShoppingListFeatureScreen);
    });
  });

  it('routes to placeholder fallback when shopping feature is disabled (AC3)', () => {
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_ENABLE_SHOPPING_LIST = 'false';

      const ShoppingRoute = require('../app/(tabs)/shopping-list').default;
      const routeElement = ShoppingRoute();

      expect(typeof routeElement.type).toBe('function');
      expect(routeElement.props.title).toBe('Shopping');
      expect(routeElement.props.description).toBe(
        'Shopping list is temporarily unavailable in this build.'
      );
    });
  });
});
