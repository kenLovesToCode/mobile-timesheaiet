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

jest.mock('../src/features/results/results-screen', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  return {
    ResultsFeatureScreen: function MockResultsFeatureScreen() {
      return React.createElement(
        View,
        null,
        React.createElement(Text, null, 'Results'),
        React.createElement(Text, null, 'Review scanned results and compare prices across stores.')
      );
    },
  };
});

jest.mock('../src/features/pricing/add-edit-price-screen', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  return {
    AddEditPriceFeatureScreen: function MockAddEditPriceFeatureScreen() {
      return React.createElement(
        View,
        null,
        React.createElement(Text, null, 'Add Price'),
        React.createElement(Text, null, 'Enter manual product pricing when scan data is unavailable.')
      );
    },
  };
});

jest.mock('../src/db/repositories/store-repository', () => ({
  listStores: jest.fn().mockResolvedValue([]),
  createStore: jest.fn(),
  updateStoreName: jest.fn(),
  toggleStoreActive: jest.fn(),
  getActiveStoreCount: jest.fn().mockResolvedValue(0),
}));

jest.mock('../src/db/repositories/shopping-list-repository', () => ({
  listShoppingListItems: jest.fn().mockResolvedValue([]),
  addOrUpdateShoppingListItem: jest.fn(),
  addOrIncrementShoppingListItem: jest.fn(),
  setShoppingListItemQuantity: jest.fn(),
  toggleShoppingListItemChecked: jest.fn(),
  getShoppingListItem: jest.fn(),
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: (props) => React.createElement(View, props, props.children),
  };
});

jest.mock('../src/features/scan/permissions/camera-permission', () => ({
  getCameraPermissionSnapshot: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
    isAvailable: true,
  }),
  requestCameraPermissionSnapshot: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
    canAskAgain: true,
    expires: 'never',
    isAvailable: true,
  }),
}));

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

async function withDevFlagAsync(devFlag, callback) {
  const previousDevFlag = global.__DEV__;
  global.__DEV__ = devFlag;

  try {
    return await callback();
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

  it('provides mocked Expo Router navigation smoke coverage for primary routes (AC2 support)', async () => {
    await withDevFlagAsync(false, async () => {
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
          'Add stores you shop at and mark at least one as active before scanning.',
        ],
        [
          'Open Scan',
          '/scan',
          'Scan',
          'Camera scanning is now live with haptics and torch support.',
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
          'Track what you plan to buy while you shop.',
        ],
      ];

      for (const [linkLabel, pathname, title, description] of routeChecks) {
        fireEvent.press(routerTesting.screen.getByText(linkLabel));
        expect(routerRender).toHavePathname(pathname);
        expect(routerTesting.screen.getByText(title)).toBeTruthy();
        if (pathname === '/shopping-list') {
          expect(await routerTesting.screen.findByText(description)).toBeTruthy();
        } else {
          expect(routerTesting.screen.getByText(description)).toBeTruthy();
        }

        if (pathname === '/stores') {
          expect(await routerTesting.screen.findByText('No stores saved yet.')).toBeTruthy();
        }

        if (pathname === '/scan') {
          expect(
            await routerTesting.screen.findByText('Activate a store to start scanning')
          ).toBeTruthy();
        }

        if (pathname === '/shopping-list') {
          expect(
            await routerTesting.screen.findByText('No items in your list yet.')
          ).toBeTruthy();
        }

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
