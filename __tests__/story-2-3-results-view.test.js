/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockFocusEffects = new Set();
let mockLocalSearchParams = {};
const mockRecordCompletedScanToResults = jest.fn();

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
  useRouter: () => ({ push: mockRouterPush }),
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
}));

jest.mock('../src/features/scan/scan-performance', () => ({
  recordCompletedScanToResults: (...args) => mockRecordCompletedScanToResults(...args),
}));

const pricingRepository = require('../src/db/repositories/pricing-repository');
const { ResultsFeatureScreen } = require('../src/features/results/results-screen');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

describe('Story 2.3 Results view for active stores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
    mockLocalSearchParams = {};
    mockRecordCompletedScanToResults.mockReset();
  });

  it('renders a row per active store and preserves ordering (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012', source: 'scan' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [
        {
          storeId: 5,
          storeName: 'Target',
          isActive: true,
          priceCents: null,
          capturedAt: null,
          priceUpdatedAt: null,
        },
        {
          storeId: 2,
          storeName: 'Costco',
          isActive: true,
          priceCents: 399,
          capturedAt: 1,
          priceUpdatedAt: 1,
        },
      ],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Costco')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Target')).toBeTruthy());

    const rows = screen.getAllByTestId(/results-store-row-/);
    const orderedIds = rows.map((row) => row.props.testID);
    expect(orderedIds).toEqual(['results-store-row-2', 'results-store-row-5']);
  });

  it('shows priced rows with timestamps and Missing rows as actionable (AC2, AC3)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012', source: 'scan' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [
        {
          storeId: 7,
          storeName: 'Whole Foods',
          isActive: true,
          priceCents: 579,
          capturedAt: new Date('2026-02-20T16:00:00Z').getTime(),
          priceUpdatedAt: 1,
        },
        {
          storeId: 9,
          storeName: 'Trader Joe’s',
          isActive: true,
          priceCents: null,
          capturedAt: null,
          priceUpdatedAt: null,
        },
      ],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('$5.79')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('Missing')).toBeTruthy());
    await waitFor(() => expect(screen.getByText(/Updated/)).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-store-row-9'));

    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/add-price',
        params: expect.objectContaining({
          barcode: '0123456789012',
          storeId: '9',
          storeName: 'Trader Joe’s',
          mode: 'add',
        }),
      })
    );
  });

  it('shows product identity with name and barcode (AC4)', async () => {
    mockLocalSearchParams = { barcode: '9999999999999' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '9999999999999',
      productName: 'Greek Yogurt',
      stores: [],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Greek Yogurt')).toBeTruthy());
    expect(screen.getByText('Barcode: 9999999999999')).toBeTruthy();
  });

  it('records scan-to-results timing after the results render', async () => {
    mockLocalSearchParams = { barcode: '0123456789012', source: 'scan' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await triggerMockFocus();
    await waitFor(() =>
      expect(screen.getByText('No active stores to compare yet.')).toBeTruthy()
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() =>
      expect(mockRecordCompletedScanToResults).toHaveBeenCalledWith('0123456789012')
    );
  });

  it('fails closed when barcode context is missing with retry guidance (AC3)', async () => {
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
    expect(screen.getByTestId('results-retry-button')).toBeTruthy();
    expect(screen.getByTestId('results-scan-button')).toBeTruthy();

    fireEvent.press(screen.getByTestId('results-scan-button'));
    expect(mockRouterPush).toHaveBeenCalledWith('/scan');
  });

  it('shows an empty state with CTA to Stores when no active stores exist (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [],
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('No active stores to compare yet.')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-manage-stores-button'));
    expect(mockRouterPush).toHaveBeenCalledWith('/stores');
  });

  it('refreshes Results when returning to focus (AC3 regression)', async () => {
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

    await waitFor(() => expect(screen.getByText('$4.99')).toBeTruthy());
  });

  it('keeps last-loaded rows visible when refresh fails (AC3 regression)', async () => {
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
    expect(screen.getByTestId('results-refresh-retry-button')).toBeTruthy();
    expect(screen.getByText('Whole Foods')).toBeTruthy();
  });
});
