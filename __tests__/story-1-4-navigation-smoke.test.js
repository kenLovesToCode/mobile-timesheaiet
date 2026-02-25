/* eslint-env jest */

const mockSafeAreaViewPropsLog = [];

const React = require('react');
const { Text, View } = require('react-native');
const { fireEvent } = require('@testing-library/react-native');

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const React = require('react');
  const { View } = require('react-native');

  return {
    ...actual,
    SafeAreaView: ({ children, ...props }) => {
      mockSafeAreaViewPropsLog.push(props);
      return React.createElement(View, props, children);
    },
    __mockSafeAreaViewPropsLog: mockSafeAreaViewPropsLog,
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
      backgroundHover: { val: '#eaf3ec' },
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

jest.mock('../src/ui/tamagui-provider', () => {
  const React = require('react');
  return {
    AppTamaguiProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../src/db/bootstrap-gate.native', () => {
  const React = require('react');
  return {
    DatabaseBootstrapGate: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../src/db/bootstrap-gate.web', () => {
  const React = require('react');
  return {
    DatabaseBootstrapGate: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock('../src/dev/device-smoke-screen', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    DeviceSmokeScreen: () => React.createElement(Text, null, 'Device smoke mocked screen'),
  };
});

const routerTesting = require('expo-router/testing-library');
const { renderRouter, testRouter } = routerTesting;
const { __mockSafeAreaViewPropsLog } = require('react-native-safe-area-context');

const RootLayout = require('../app/_layout').default;
const IndexRoute = require('../app/index').default;
const StoresRoute = require('../app/stores').default;
const ScanRoute = require('../app/scan').default;
const ResultsRoute = require('../app/results').default;
const AddPriceRoute = require('../app/add-price').default;
const ShoppingListRoute = require('../app/shopping-list').default;

function withDevFlag(devFlag, callback) {
  const previousDevFlag = global.__DEV__;
  global.__DEV__ = devFlag;

  try {
    return callback();
  } finally {
    global.__DEV__ = previousDevFlag;
  }
}

function loadDeviceSmokeRoute(devFlag) {
  let DeviceSmokeRoute;

  withDevFlag(devFlag, () => {
    jest.isolateModules(() => {
      DeviceSmokeRoute = require('../app/dev/device-smoke').default;
    });
  });

  return DeviceSmokeRoute;
}

describe('Story 1.4 app shell navigation scaffold', () => {
  beforeEach(() => {
    __mockSafeAreaViewPropsLog.length = 0;
  });

  it('provides mocked Expo Router navigation smoke coverage for primary routes (AC2 support)', () => {
    withDevFlag(false, () => {
      const routerRender = renderRouter(
        {
          _layout: RootLayout,
          index: IndexRoute,
          stores: StoresRoute,
          scan: ScanRoute,
          results: ResultsRoute,
          'add-price': AddPriceRoute,
          'shopping-list': ShoppingListRoute,
        },
        { initialUrl: '/' }
      );

      expect(routerRender).toHavePathname('/');
      expect(routerTesting.screen.getByText('PriceTag')).toBeTruthy();
      expect(
        routerTesting.screen.queryByText('Open device smoke screen (camera permission + haptics)')
      ).toBeNull();

      const routeChecks = [
        [
          'Open Stores',
          '/stores',
          'Stores',
          'Manage active store context and switch between saved stores.',
        ],
        [
          'Open Scan',
          '/scan',
          'Scan',
          'Scan product barcodes and capture price details for the active store.',
        ],
        [
          'Open Results',
          '/results',
          'Results',
          'Review scanned results and compare prices across stores.',
        ],
        [
          'Open Add Price',
          '/add-price',
          'Add Price',
          'Enter manual product pricing when scan data is unavailable.',
        ],
        [
          'Open Shopping List',
          '/shopping-list',
          'Shopping List',
          'Track planned purchases and current cart state.',
        ],
      ];

      for (const [linkLabel, pathname, title, description] of routeChecks) {
        fireEvent.press(routerTesting.screen.getByText(linkLabel));
        expect(routerRender).toHavePathname(pathname);
        expect(routerTesting.screen.getByText(title)).toBeTruthy();
        expect(routerTesting.screen.getByText(description)).toBeTruthy();

        testRouter.push('/');
        expect(routerRender).toHavePathname('/');
      }

      const safeAreaEdgeSignatures = __mockSafeAreaViewPropsLog
        .map((props) => (Array.isArray(props?.edges) ? props.edges.join(',') : null))
        .filter(Boolean);

      expect(safeAreaEdgeSignatures).toContain('top,bottom,left,right');
      expect(
        __mockSafeAreaViewPropsLog.some((props) => {
          const style = props?.style;
          return style && !Array.isArray(style) && style.flex === 1;
        })
      ).toBe(true);
    });
  });

  it('exercises dev-route protection in root layout by __DEV__ guard', () => {
    const rootRouteMap = {
      _layout: RootLayout,
      index: IndexRoute,
      stores: StoresRoute,
      scan: ScanRoute,
      results: ResultsRoute,
      'add-price': AddPriceRoute,
      'shopping-list': ShoppingListRoute,
      'dev/device-smoke': loadDeviceSmokeRoute(true),
    };

    withDevFlag(true, () => {
      const devRouterRender = renderRouter(rootRouteMap, { initialUrl: '/dev/device-smoke' });

      expect(devRouterRender).toHavePathname('/dev/device-smoke');
      expect(routerTesting.screen.getByText('Device smoke mocked screen')).toBeTruthy();
    });

    withDevFlag(false, () => {
      const prodRouterRender = renderRouter(rootRouteMap, { initialUrl: '/dev/device-smoke' });

      expect(prodRouterRender).not.toHavePathname('/dev/device-smoke');
      expect(routerTesting.screen.queryByText('Device smoke mocked screen')).toBeNull();
    });
  });

  it('returns a home redirect from the real dev route wrapper outside dev mode', () => {
    const DeviceSmokeRouteInProd = loadDeviceSmokeRoute(false);
    const routeElement = withDevFlag(false, () => DeviceSmokeRouteInProd());

    expect(routeElement?.props?.href).toBe('/');
  });
});
