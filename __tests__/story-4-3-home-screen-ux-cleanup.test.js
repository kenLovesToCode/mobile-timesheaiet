/* eslint-env jest */

const React = require('react');
const { Text, View } = require('react-native');
const { fireEvent } = require('@testing-library/react-native');
const routerTesting = require('expo-router/testing-library');
const { renderRouter } = routerTesting;

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

jest.mock('tamagui', () => ({
  createTokens: (tokens) => tokens,
  createFont: (font) => font,
  createTamagui: (config) => config,
  useTheme: () => ({
    background: { val: '#f2f7f3' },
    backgroundHover: { val: '#eaf3ec' },
    borderColor: { val: '#cccccc' },
    color: { val: '#1c1c1e' },
    textPrimary: { val: '#1c1c1e' },
    textSecondary: { val: '#6d6d72' },
    accentBackground: { val: '#34c759' },
    accentBorderColor: { val: '#34c759' },
    accentColor: { val: '#ffffff' },
    shadowColor: { val: '#00000022' },
  }),
}));

function createStubScreen(label) {
  return function StubScreen() {
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, label)
    );
  };
}

function getHomeRouteMap(routerRoot) {
  return {
    index: require(`../${routerRoot}/(tabs)/index`).default,
    scan: createStubScreen('Scan Route'),
    stores: createStubScreen('Stores Route'),
    'shopping-list': createStubScreen('Shopping Route'),
  };
}

describe('Story 4.3 home screen UX cleanup', () => {
  it.each(['app', 'app-production'])(
    'renders calm home CTAs and hides debug route list for %s root (AC1, AC2, AC3)',
    (routerRoot) => {
      const routeMap = getHomeRouteMap(routerRoot);
      const routerRender = renderRouter(routeMap, { initialUrl: '/' });

      expect(routerRender).toHavePathname('/');
      expect(
        routerTesting.screen.queryByText('Open device smoke screen (camera permission + haptics)')
      ).toBeNull();
      expect(routerTesting.screen.queryByText('/dev/device-smoke')).toBeNull();

      expect(routerTesting.screen.getByText('PriceTag')).toBeTruthy();
      expect(
        routerTesting.screen.getByText('Scan fast, compare prices, and keep your shopping list focused.')
      ).toBeTruthy();
      expect(
        routerTesting.screen.getByText('Start with Scan, then jump to Stores or Shopping when needed.')
      ).toBeTruthy();

      fireEvent.press(routerTesting.screen.getByTestId('home-primary-cta-scan'));
      expect(routerRender).toHavePathname('/scan');
      routerTesting.testRouter.push('/');
      expect(routerRender).toHavePathname('/');

      fireEvent.press(routerTesting.screen.getByTestId('home-secondary-cta-stores'));
      expect(routerRender).toHavePathname('/stores');
      routerTesting.testRouter.push('/');
      expect(routerRender).toHavePathname('/');

      fireEvent.press(routerTesting.screen.getByTestId('home-secondary-cta-shopping'));
      expect(routerRender).toHavePathname('/shopping-list');
    }
  );
});
