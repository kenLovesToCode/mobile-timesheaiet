/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
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
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, replace: mockRouterReplace }),
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

const pricingRepository = require('../src/db/repositories/pricing-repository');
const storeRepository = require('../src/db/repositories/store-repository');
const { ResultsFeatureScreen } = require('../src/features/results/results-screen');
const { AddEditPriceFeatureScreen } = require('../src/features/pricing/add-edit-price-screen');
const {
  __resetResultsRefreshMeasurementsForTests,
  getResultsRefreshMeasurementSummary,
  markPendingResultsRefreshMeasurement,
  recordCompletedResultsRefreshMeasurement,
} = require('../src/features/results/results-refresh-performance');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

describe('Story 2.2 add/edit price and product info flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockRouterBack.mockReset();
    mockRouterReplace.mockReset();
    mockFocusEffects.clear();
    mockLocalSearchParams = {};
    __resetResultsRefreshMeasurementsForTests();
    pricingRepository.getProductByBarcode.mockResolvedValue(null);
    storeRepository.getStoreById.mockImplementation(async (id) => {
      const namesById = {
        2: 'Target',
        3: 'Whole Foods',
        5: 'Safeway',
        7: 'Costco',
      };

      return {
        id,
        name: namesById[id] ?? `Store ${id}`,
        isActive: true,
        createdAt: 1,
        updatedAt: 1,
      };
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens add-price flow with selected store and barcode when tapping a Missing row (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: null,
      stores: [
        {
          storeId: 11,
          storeName: 'Trader Joe’s',
          isActive: true,
          priceCents: null,
          capturedAt: null,
          priceUpdatedAt: null,
        },
      ],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Trader Joe’s')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-store-row-11'));

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/add-price',
        params: expect.objectContaining({
          barcode: '0123456789012',
          storeId: '11',
          storeName: 'Trader Joe’s',
          mode: 'add',
        }),
      })
    );
  });

  it('prevents duplicate add-price navigation when tapping a row rapidly (AI-Review)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: null,
      stores: [
        {
          storeId: 11,
          storeName: 'Trader Joe’s',
          isActive: true,
          priceCents: null,
          capturedAt: null,
          priceUpdatedAt: null,
        },
      ],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Trader Joe’s')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-store-row-11'));
    fireEvent.press(screen.getByTestId('results-store-row-11'));

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });

  it('fails closed when Results route barcode context is missing (AI-Review)', async () => {
    mockLocalSearchParams = {};
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: null,
      stores: [],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() =>
      expect(
        screen.getByText('Missing barcode context. Return to Scan and open Results again.')
      ).toBeTruthy()
    );

    expect(pricingRepository.getResultsByBarcodeAcrossActiveStores).not.toHaveBeenCalled();
    expect(screen.queryByText('Loading product...')).toBeNull();
  });

  it('requires product name when unknown and guards duplicate submits during save (AC2)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      mode: 'add',
    };

    let resolveSave;
    pricingRepository.saveStorePrice.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        })
    );

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.99');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(screen.getByText('Product name is required before saving a new price.')).toBeTruthy()
    );
    expect(pricingRepository.saveStorePrice).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('add-price-product-name-input'), 'Greek Yogurt');
    fireEvent.press(screen.getByTestId('add-price-save-button'));
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 2,
        priceCents: 399,
        productName: 'Greek Yogurt',
      })
    );
    expect(pricingRepository.saveStorePrice).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSave({
        barcode: '0123456789012',
        productName: 'Greek Yogurt',
        storeId: 2,
        priceCents: 399,
        capturedAt: 1,
        updatedAt: 1,
      });
    });

    await waitFor(() => expect(mockRouterBack).toHaveBeenCalledTimes(1));
  });

  it('resets add/edit form state when route params change on a reused route instance (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      productName: 'Old Product',
      priceCents: '349',
      mode: 'edit',
    };

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-price-product-name-input'), 'Draft Product');
    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '4.99');

    mockLocalSearchParams = {
      barcode: '9999999999999',
      storeId: '5',
      storeName: 'Safeway',
      productName: 'New Product',
      priceCents: '199',
      mode: 'edit',
    };

    screen.rerender(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() =>
      expect(screen.getByTestId('add-price-product-name-input').props.value).toBe('New Product')
    );
    expect(screen.getByTestId('add-price-value-input').props.value).toBe('1.99');
  });

  it('does not require product name when canonical product exists but route param is stale blank (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      productName: '   ',
      mode: 'add',
    };

    pricingRepository.getProductByBarcode.mockResolvedValue({
      barcode: '0123456789012',
      name: 'Greek Yogurt',
    });
    pricingRepository.saveStorePrice.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Greek Yogurt',
      storeId: 2,
      priceCents: 399,
      capturedAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());
    await waitFor(() =>
      expect(pricingRepository.getProductByBarcode).toHaveBeenCalledWith({
        barcode: '0123456789012',
      })
    );

    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.99');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 2,
        priceCents: 399,
        productName: undefined,
      })
    );
    expect(screen.queryByText('Product name is required before saving a new price.')).toBeNull();
  });

  it('does not false-block save when canonical product lookup fails (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      productName: '   ',
      mode: 'add',
    };

    pricingRepository.getProductByBarcode.mockRejectedValue(new Error('lookup failed'));
    pricingRepository.saveStorePrice.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Greek Yogurt',
      storeId: 2,
      priceCents: 399,
      capturedAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.99');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 2,
        priceCents: 399,
        productName: undefined,
      })
    );
    expect(screen.queryByText('Product name is required before saving a new price.')).toBeNull();
  });

  it('reconciles stale route productName with canonical lookup without clobbering user edits (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '7',
      storeName: 'Costco',
      productName: 'Old Route Name',
      priceCents: '349',
      mode: 'edit',
    };

    let resolveProductLookup;
    pricingRepository.getProductByBarcode.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveProductLookup = resolve;
        })
    );
    pricingRepository.saveStorePrice.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'User Draft Name',
      storeId: 7,
      priceCents: 379,
      capturedAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    expect(screen.getByTestId('add-price-product-name-input').props.value).toBe('Old Route Name');

    fireEvent.changeText(screen.getByTestId('add-price-product-name-input'), 'User Draft Name');

    await act(async () => {
      resolveProductLookup({
        barcode: '0123456789012',
        name: 'Canonical Name',
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('add-price-product-name-input').props.value).toBe('User Draft Name');

    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.79');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 7,
        priceCents: 379,
        productName: 'User Draft Name',
      })
    );
  });

  it('fails closed when add/edit route barcode context is blank after trimming (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '   ',
      storeId: '2',
      storeName: 'Target',
      mode: 'add',
    };

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByText('Missing price context')).toBeTruthy());
    expect(screen.queryByTestId('add-price-save-button')).toBeNull();
    expect(pricingRepository.saveStorePrice).not.toHaveBeenCalled();
  });

  it('fails closed when add/edit route storeId param is malformed (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2abc',
      storeName: 'Target',
      mode: 'add',
    };

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByText('Missing price context')).toBeTruthy());
    expect(storeRepository.getStoreById).not.toHaveBeenCalled();
    expect(screen.queryByTestId('add-price-save-button')).toBeNull();
  });

  it('allows cancel/back while verifying store context (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      mode: 'add',
    };

    let resolveStorePromise;
    storeRepository.getStoreById.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStorePromise = resolve;
      })
    );

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByText('Verifying store context...')).toBeTruthy());

    fireEvent.press(screen.getByTestId('add-price-verifying-back-button'));
    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012' },
    });

    resolveStorePromise({
      id: 2,
      name: 'Target',
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    });
  });

  it('fails closed when edit route priceCents param is malformed (AI-Review)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      productName: 'Milk',
      priceCents: '349abc',
      mode: 'edit',
    };

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByText('Missing price context')).toBeTruthy());
    expect(screen.queryByTestId('add-price-save-button')).toBeNull();
    expect(pricingRepository.saveStorePrice).not.toHaveBeenCalled();
  });

  it('supports edit mode with existing price prefill and save behavior (AC6)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '7',
      storeName: 'Costco',
      productName: 'Olive Oil',
      priceCents: '349',
      mode: 'edit',
    };

    pricingRepository.saveStorePrice.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Olive Oil',
      storeId: 7,
      priceCents: 379,
      capturedAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    expect(screen.getByTestId('add-price-value-input').props.value).toBe('3.49');
    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.79');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 7,
        priceCents: 379,
        productName: undefined,
      })
    );
    await waitFor(() => expect(mockRouterBack).toHaveBeenCalledTimes(1));
  });

  it('includes the edited product name in edit mode when the user changes it', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '7',
      storeName: 'Costco',
      productName: 'Olive Oil',
      priceCents: '349',
      mode: 'edit',
    };

    pricingRepository.saveStorePrice.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Extra Virgin Olive Oil',
      storeId: 7,
      priceCents: 379,
      capturedAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(AddEditPriceFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-price-product-name-input'), 'Extra Virgin Olive Oil');
    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.79');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 7,
        priceCents: 379,
        productName: 'Extra Virgin Olive Oil',
      })
    );
  });

  it('refreshes Results rows when screen regains focus after returning from add/edit flow (AC4/AC5 regression)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: null,
        stores: [
          {
            storeId: 3,
            storeName: 'Whole Foods',
            isActive: true,
            priceCents: null,
            capturedAt: null,
            priceUpdatedAt: null,
          },
        ],
      })
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [
          {
            storeId: 3,
            storeName: 'Whole Foods',
            isActive: true,
            priceCents: 499,
            capturedAt: 1,
            priceUpdatedAt: 2,
          },
        ],
      });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Missing')).toBeTruthy());

    await triggerMockFocus();
    expect(screen.getByText('Whole Foods')).toBeTruthy();
    expect(screen.queryByText('Loading results...')).toBeNull();

    await waitFor(() => expect(screen.getByText('$4.99')).toBeTruthy());
    expect(pricingRepository.getResultsByBarcodeAcrossActiveStores).toHaveBeenCalledTimes(2);
  });

  it('shows a retryable refresh error while keeping stale Results visible when a focus refresh fails', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [
          {
            storeId: 3,
            storeName: 'Whole Foods',
            isActive: true,
            priceCents: 499,
            capturedAt: 1,
            priceUpdatedAt: 1,
          },
        ],
      })
      .mockRejectedValueOnce(new Error('refresh failed'));

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('$4.99')).toBeTruthy());

    await triggerMockFocus();

    await waitFor(() =>
      expect(
        screen.getByText('Could not refresh prices. Showing the last loaded results.')
      ).toBeTruthy()
    );

    expect(screen.getByText('$4.99')).toBeTruthy();
    expect(screen.getByTestId('results-refresh-retry-button')).toBeTruthy();
  });

  it('canonicalizes stale route storeName to the current store record and keeps save flow available', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '7',
      storeName: 'Old Costco Name',
      mode: 'edit',
      productName: 'Olive Oil',
      priceCents: '349',
    };

    pricingRepository.saveStorePrice.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Olive Oil',
      storeId: 7,
      priceCents: 379,
      capturedAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(storeRepository.getStoreById).toHaveBeenCalledWith(7));
    await waitFor(() => expect(screen.getByTestId('add-price-save-button')).toBeTruthy());

    expect(screen.getByText('Store name changed. Using the current saved store name.')).toBeTruthy();
    expect(screen.getByTestId('add-price-store-input').props.value).toBe('Costco');

    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '3.79');
    fireEvent.press(screen.getByTestId('add-price-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        storeId: 7,
        priceCents: 379,
        productName: undefined,
      })
    );
  });

  it('shows the year in Results timestamp labels for older prices', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-26T12:00:00Z'));

    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [
        {
          storeId: 3,
          storeName: 'Whole Foods',
          isActive: true,
          priceCents: 499,
          capturedAt: new Date('2024-01-15T18:30:00Z').getTime(),
          priceUpdatedAt: 1,
        },
      ],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('$4.99')).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByText(/Updated .*2024/i)).toBeTruthy()
    );
  });

  it('ignores stale overlapping refresh responses and keeps the latest Results rows', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };

    let resolveStaleRefresh;
    pricingRepository.getResultsByBarcodeAcrossActiveStores
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [
          {
            storeId: 3,
            storeName: 'Whole Foods',
            isActive: true,
            priceCents: 499,
            capturedAt: 1,
            priceUpdatedAt: 1,
          },
        ],
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveStaleRefresh = resolve;
          })
      )
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [
          {
            storeId: 3,
            storeName: 'Whole Foods',
            isActive: true,
            priceCents: 579,
            capturedAt: 2,
            priceUpdatedAt: 2,
          },
        ],
      });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('$4.99')).toBeTruthy());

    await triggerMockFocus();
    await triggerMockFocus();

    await waitFor(() => expect(screen.getByText('$5.79')).toBeTruthy());

    await act(async () => {
      resolveStaleRefresh({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [
          {
            storeId: 3,
            storeName: 'Whole Foods',
            isActive: true,
            priceCents: 549,
            capturedAt: 3,
            priceUpdatedAt: 3,
          },
        ],
      });
      await Promise.resolve();
    });

    expect(screen.getByText('$5.79')).toBeTruthy();
    expect(screen.queryByText('$5.49')).toBeNull();
  });

  it('updates Results after a delayed focus-based refresh response (AC4 regression coverage)', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-25T12:00:00Z'));

    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: null,
        stores: [
          {
            storeId: 5,
            storeName: 'Safeway',
            isActive: true,
            priceCents: null,
            capturedAt: null,
            priceUpdatedAt: null,
          },
        ],
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                barcode: '0123456789012',
                productName: 'Bananas',
                stores: [
                  {
                    storeId: 5,
                    storeName: 'Safeway',
                    isActive: true,
                    priceCents: 129,
                    capturedAt: 1,
                    priceUpdatedAt: 2,
                  },
                ],
              });
            }, 120);
          })
      );

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Missing')).toBeTruthy());

    await triggerMockFocus();

    await act(async () => {
      jest.advanceTimersByTime(120);
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByText('$1.29')).toBeTruthy());
  });

  it('records save-to-Results-refresh instrumentation samples in the add/edit loop (not AC5 acceptance evidence)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    let currentPriceCents = null;

    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockImplementation(async () => ({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [
        {
          storeId: 3,
          storeName: 'Whole Foods',
          isActive: true,
          priceCents: currentPriceCents,
          capturedAt: currentPriceCents == null ? null : Date.now(),
          priceUpdatedAt: currentPriceCents == null ? null : Date.now(),
        },
      ],
    }));

    pricingRepository.saveStorePrice.mockImplementation(async ({ priceCents }) => {
      currentPriceCents = priceCents;

      return {
        barcode: '0123456789012',
        productName: 'Spinach',
        storeId: 3,
        priceCents,
        capturedAt: Date.now(),
        updatedAt: Date.now(),
      };
    });

    const resultsScreen = render(React.createElement(ResultsFeatureScreen));
    await waitFor(() => expect(resultsScreen.getByText('Missing')).toBeTruthy());

    for (let iteration = 0; iteration < 20; iteration += 1) {
      const nextPriceCents = 100 + iteration;

      mockLocalSearchParams = {
        barcode: '0123456789012',
        storeId: '3',
        storeName: 'Whole Foods',
        productName: 'Spinach',
        priceCents: String(currentPriceCents ?? ''),
        mode: currentPriceCents == null ? 'add' : 'edit',
      };

      const addPriceScreen = render(React.createElement(AddEditPriceFeatureScreen));
      await waitFor(() => expect(addPriceScreen.getByTestId('add-price-save-button')).toBeTruthy());

      fireEvent.changeText(
        addPriceScreen.getByTestId('add-price-value-input'),
        (nextPriceCents / 100).toFixed(2)
      );
      fireEvent.press(addPriceScreen.getByTestId('add-price-save-button'));

      await waitFor(() => expect(mockRouterBack).toHaveBeenCalledTimes(iteration + 1));
      addPriceScreen.unmount();

      mockLocalSearchParams = { barcode: '0123456789012' };
      await triggerMockFocus();

      await waitFor(() =>
        expect(resultsScreen.getByText(`$${(nextPriceCents / 100).toFixed(2)}`)).toBeTruthy()
      );
    }

    const summary = getResultsRefreshMeasurementSummary();

    expect(summary.count).toBeGreaterThanOrEqual(20);
    expect(summary.latestSample).toEqual(
      expect.objectContaining({
        barcode: '0123456789012',
      })
    );
    expect(summary.p95Ms).not.toBeNull();
    expect(summary.p95Ms).toBeGreaterThanOrEqual(0);
    expect(summary.maxMs).toBeGreaterThanOrEqual(0);
  });

  it('scopes Results refresh performance summaries by barcode and run start time', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-26T10:00:00Z'));

    markPendingResultsRefreshMeasurement('111');
    recordCompletedResultsRefreshMeasurement('111');

    jest.setSystemTime(new Date('2026-02-26T10:00:00.500Z'));
    const runStartMs = Date.now();

    jest.setSystemTime(new Date('2026-02-26T10:00:01Z'));
    markPendingResultsRefreshMeasurement('111');
    recordCompletedResultsRefreshMeasurement('111');

    jest.setSystemTime(new Date('2026-02-26T10:00:02Z'));
    markPendingResultsRefreshMeasurement('222');
    recordCompletedResultsRefreshMeasurement('222');

    const scoped = getResultsRefreshMeasurementSummary({
      barcode: '111',
      sinceMeasuredAtMs: runStartMs,
    });
    const unscoped = getResultsRefreshMeasurementSummary();

    expect(scoped.count).toBe(1);
    expect(scoped.latestSample).toEqual(expect.objectContaining({ barcode: '111' }));
    expect(unscoped.count).toBe(3);
  });

  it('scopes runtime perf logger summaries by barcode and current run window (AI-Review)', async () => {
    jest.useFakeTimers();
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    jest.setSystemTime(new Date('2026-02-26T10:00:00Z'));
    markPendingResultsRefreshMeasurement('111');
    recordCompletedResultsRefreshMeasurement('111');

    jest.setSystemTime(new Date('2026-02-26T10:00:01Z'));
    markPendingResultsRefreshMeasurement('222');
    recordCompletedResultsRefreshMeasurement('222');

    jest.setSystemTime(new Date('2026-02-26T10:00:02Z'));
    markPendingResultsRefreshMeasurement('111');
    recordCompletedResultsRefreshMeasurement('111');

    expect(consoleInfoSpy).toHaveBeenCalled();
    const lastLog = String(consoleInfoSpy.mock.calls.at(-1)?.[0] ?? '');
    expect(lastLog).toMatch(/\[results-perf\]/);
    expect(lastLog).toMatch(/samples=1,/);

    consoleInfoSpy.mockRestore();
  });

  it('queues overlapping results refresh measurements for the same barcode (AI-Review)', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-26T10:00:00Z'));

    markPendingResultsRefreshMeasurement('111');
    jest.setSystemTime(new Date('2026-02-26T10:00:01Z'));
    markPendingResultsRefreshMeasurement('111');

    jest.setSystemTime(new Date('2026-02-26T10:00:02Z'));
    recordCompletedResultsRefreshMeasurement('111');
    jest.setSystemTime(new Date('2026-02-26T10:00:03Z'));
    recordCompletedResultsRefreshMeasurement('111');

    const summary = getResultsRefreshMeasurementSummary({ barcode: '111' });

    expect(summary.count).toBe(2);
    expect(summary.maxMs).toBeGreaterThanOrEqual(0);
  });
});
