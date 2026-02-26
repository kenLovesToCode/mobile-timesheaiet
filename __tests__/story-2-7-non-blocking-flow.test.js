/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockFocusEffects = new Set();
const mockFocusCleanups = new Map();
let mockLocalSearchParams = {};

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  const React = require('react');
  const { View } = require('react-native');

  return {
    ...actual,
    SafeAreaView: ({ children, ...props }) => React.createElement(View, props, children),
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
    back: mockRouterBack,
    replace: mockRouterReplace,
  }),
  useLocalSearchParams: () => mockLocalSearchParams,
  useFocusEffect: (effect) => {
    const React = require('react');

    React.useEffect(() => {
      mockFocusEffects.add(effect);
      const cleanup = effect();
      mockFocusCleanups.set(effect, cleanup);

      return () => {
        mockFocusEffects.delete(effect);
        const cleanupFn = mockFocusCleanups.get(effect);
        mockFocusCleanups.delete(effect);
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      };
    }, [effect]);
  },
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: (props) => React.createElement(View, { testID: 'mock-camera-view' }, props.children),
  };
});

jest.mock('../src/db/repositories/store-repository', () => ({
  getActiveStoreCount: jest.fn(),
  getStoreById: jest.fn(),
}));

jest.mock('../src/db/repositories/recent-scans-repository', () => ({
  listRecentScans: jest.fn(),
  recordRecentScan: jest.fn(),
}));

jest.mock('../src/features/scan/permissions/camera-permission', () => ({
  getCameraPermissionSnapshot: jest.fn(),
  requestCameraPermissionSnapshot: jest.fn(),
}));

jest.mock('../src/db/repositories/pricing-repository', () => ({
  getProductByBarcode: jest.fn(),
  saveStorePrice: jest.fn(),
  getResultsByBarcodeAcrossActiveStores: jest.fn(),
}));

const storeRepository = require('../src/db/repositories/store-repository');
const recentScansRepository = require('../src/db/repositories/recent-scans-repository');
const cameraPermission = require('../src/features/scan/permissions/camera-permission');
const pricingRepository = require('../src/db/repositories/pricing-repository');
const { AddEditPriceFeatureScreen } = require('../src/features/pricing/add-edit-price-screen');
const { ScanFeatureScreen } = require('../src/features/scan/scan-screen');
const { ResultsFeatureScreen } = require('../src/features/results/results-screen');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      const cleanup = effect();
      mockFocusCleanups.set(effect, cleanup);
    }
  });
}

async function triggerMockBlur() {
  await act(async () => {
    for (const cleanup of [...mockFocusCleanups.values()]) {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    }
    mockFocusCleanups.clear();
  });
}

function createPermissionSnapshot(overrides = {}) {
  return {
    status: 'denied',
    granted: false,
    canAskAgain: false,
    expires: 'never',
    isAvailable: true,
    ...overrides,
  };
}

describe('Story 2.7 non-blocking flow behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockRouterBack.mockReset();
    mockRouterReplace.mockReset();
    mockFocusEffects.clear();
    mockFocusCleanups.clear();
    mockLocalSearchParams = {};
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    storeRepository.getStoreById.mockResolvedValue({
      id: 2,
      name: 'Target',
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    });
    recentScansRepository.listRecentScans.mockResolvedValue([]);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(createPermissionSnapshot());
    cameraPermission.requestCameraPermissionSnapshot.mockResolvedValue(createPermissionSnapshot());
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Greek Yogurt',
      stores: [
        {
          storeId: 2,
          storeName: 'Target',
          isActive: true,
          priceCents: 399,
          capturedAt: 1,
          priceUpdatedAt: 1,
        },
      ],
    });
  });

  it('routes back to Results when canceling add/edit price (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012', storeId: '2', mode: 'add' };

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('add-price-cancel-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('add-price-cancel-button'));

    expect(mockRouterReplace).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012' },
    });
  });

  it('clears manual entry UI when returning to Scan (AC2)', async () => {
    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.getByTestId('scan-fallback-manual-entry')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-fallback-manual-entry'));

    expect(screen.getByTestId('scan-fallback-manual-input')).toBeTruthy();

    await triggerMockBlur();
    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.queryByTestId('scan-fallback-manual-input')).toBeNull()
    );
  });

  it('resets torch state when returning to Scan (AC2)', async () => {
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ granted: true, canAskAgain: false })
    );
    cameraPermission.requestCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ granted: true, canAskAgain: false })
    );

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();

    await waitFor(() => expect(screen.getByTestId('scan-torch-toggle')).toBeTruthy());

    fireEvent.press(screen.getByTestId('scan-torch-toggle'));
    expect(screen.getByText('Torch On')).toBeTruthy();

    await triggerMockBlur();
    await triggerMockFocus();

    await waitFor(() => expect(screen.getByText('Torch Off')).toBeTruthy());
  });

  it('keeps Results usable on re-entry without forcing navigation (AC2)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Target')).toBeTruthy());

    await triggerMockBlur();
    await triggerMockFocus();

    await waitFor(() => expect(screen.getByText('Target')).toBeTruthy());
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it('clears add/edit draft state after leaving and returning (AC2)', async () => {
    mockLocalSearchParams = {
      barcode: '0123456789012',
      storeId: '2',
      storeName: 'Target',
      productName: 'Milk',
      priceCents: '349',
      mode: 'edit',
    };

    const screen = render(React.createElement(AddEditPriceFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('add-price-product-name-input')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('add-price-product-name-input'), 'Draft Name');
    fireEvent.changeText(screen.getByTestId('add-price-value-input'), '4.99');

    await triggerMockBlur();
    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.getByTestId('add-price-product-name-input').props.value).toBe('Milk')
    );
    expect(screen.getByTestId('add-price-value-input').props.value).toBe('3.49');
  });

  it('ignores stale recent scan failures after a newer success (AC2)', async () => {
    let rejectFirst;

    recentScansRepository.listRecentScans
      .mockReturnValueOnce(
        new Promise((_, reject) => {
          rejectFirst = reject;
        })
      )
      .mockResolvedValueOnce([
        { id: 1, barcode: '0123456789012', scannedAt: 1, source: 'manual' },
      ]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.getByTestId('scan-recent-scans-refresh')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-recent-scans-refresh'));

    await waitFor(() => expect(screen.getByText('0123456789012')).toBeTruthy());

    await act(async () => {
      rejectFirst(new Error('late failure'));
    });

    expect(screen.getByText('0123456789012')).toBeTruthy();
    expect(screen.queryByText('Recent scans are unavailable right now.')).toBeNull();
  });
});
