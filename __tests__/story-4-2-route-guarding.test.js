/* eslint-env jest */

const React = require('react');
const { fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
const mockFocusEffects = new Set();
let mockLocalSearchParams = {};

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
      success: { val: '#34c759' },
      shadowColor: { val: '#00000022' },
    }),
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: mockRouterReplace,
    back: mockRouterBack,
    canGoBack: () => false,
  }),
  useLocalSearchParams: () => mockLocalSearchParams,
  useFocusEffect: (effect) => {
    const React = require('react');

    React.useEffect(() => {
      mockFocusEffects.add(effect);
      const cleanup = effect();

      return () => {
        mockFocusEffects.delete(effect);
        if (typeof cleanup === 'function') {
          cleanup();
        }
      };
    }, [effect]);
  },
}));

jest.mock('../src/db/repositories/pricing-repository', () => ({
  getResultsByBarcodeAcrossActiveStores: jest.fn(),
  getProductByBarcode: jest.fn(),
  saveStorePrice: jest.fn(),
}));

jest.mock('../src/db/repositories/store-repository', () => ({
  getStoreById: jest.fn(),
}));

jest.mock('../src/db/repositories/shopping-list-repository', () => ({
  addOrIncrementShoppingListItem: jest.fn(),
}));

const pricingRepository = require('../src/db/repositories/pricing-repository');
const storeRepository = require('../src/db/repositories/store-repository');
const { ResultsFeatureScreen } = require('../src/features/results/results-screen');
const { AddEditPriceFeatureScreen } = require('../src/features/pricing/add-edit-price-screen');
const { guardAddPriceRouteContext } = require('../src/features/scan/guards/route-context-guard');

describe('Story 4.2 route guarding for Results and Add Price', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalSearchParams = {};
    mockFocusEffects.clear();
    pricingRepository.getProductByBarcode.mockResolvedValue(null);
    storeRepository.getStoreById.mockResolvedValue({
      id: 2,
      name: 'Target',
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    });
  });

  it('redirects Results to Scan when barcode context is missing (AC1)', async () => {
    mockLocalSearchParams = {};

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/scan'));
    expect(pricingRepository.getResultsByBarcodeAcrossActiveStores).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('results-guard-scan-button'));
    expect(mockRouterReplace).toHaveBeenCalledWith('/scan');
  });

  it('redirects Add Price to Scan without barcode context (AC2)', async () => {
    mockLocalSearchParams = { storeId: '2', storeName: 'Target', mode: 'add' };

    render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith('/scan'));
    expect(storeRepository.getStoreById).not.toHaveBeenCalled();
  });

  it('redirects Add Price to Results when barcode exists but store context is missing (AC2)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };

    render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: '/results',
        params: { barcode: '0123456789012' },
      })
    );
    expect(storeRepository.getStoreById).not.toHaveBeenCalled();
  });

  it('redirects Add Price to Results when store verification is stale/invalid (AC2 regression)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      mode: 'add',
    };
    storeRepository.getStoreById.mockResolvedValue(null);

    render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() =>
      expect(mockRouterReplace).toHaveBeenCalledWith({
        pathname: '/results',
        params: { barcode: '0123456789012' },
      })
    );
  });

  it('keeps scan -> results -> add-price path in allowed state without missing-context errors (AC3)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012', source: 'scan' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [
        {
          storeId: 2,
          storeName: 'Target',
          isActive: true,
          priceCents: null,
          capturedAt: null,
          priceUpdatedAt: null,
        },
      ],
    });

    const resultsScreen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(resultsScreen.getByText('Target')).toBeTruthy());
    expect(
      resultsScreen.queryByText('Missing barcode context. Return to Scan and open Results again.')
    ).toBeNull();

    fireEvent.press(resultsScreen.getByTestId('results-store-row-2'));
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/add-price',
        params: expect.objectContaining({
          barcode: '0123456789012',
          storeId: '2',
          storeName: 'Target',
        }),
      })
    );

    const addPriceGuard = guardAddPriceRouteContext({
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      mode: 'add',
    });
    expect(addPriceGuard).toEqual(
      expect.objectContaining({
        decision: 'allow',
        context: expect.objectContaining({
          barcode: '0123456789012',
          storeId: 2,
          storeName: 'Target',
          mode: 'add',
        }),
      })
    );
  });

  it('routes Add Price cancel recovery deterministically to Results (AC2 regression)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      mode: 'add',
    };
    storeRepository.getStoreById.mockImplementation(
      () =>
        new Promise(() => {
          // Keep screen in "verifying" state long enough to assert deterministic navigation CTA.
        })
    );

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('add-price-cancel-button')).toBeTruthy());
    fireEvent.press(screen.getByTestId('add-price-cancel-button'));

    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012' },
    });
    expect(mockRouterBack).not.toHaveBeenCalled();
  });
});
