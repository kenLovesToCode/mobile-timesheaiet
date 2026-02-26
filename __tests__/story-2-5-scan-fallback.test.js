/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockFocusEffects = new Set();
const mockCameraViewProps = { current: null };

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
  useRouter: () => ({ push: mockRouterPush }),
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

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    CameraView: (props) => {
      mockCameraViewProps.current = props;
      return React.createElement(View, { testID: 'mock-camera-view' }, props.children);
    },
  };
});

jest.mock('../src/db/repositories/store-repository', () => ({
  getActiveStoreCount: jest.fn(),
}));

jest.mock('../src/db/repositories/recent-scans-repository', () => ({
  listRecentScans: jest.fn(),
  recordRecentScan: jest.fn(),
}));

jest.mock('../src/features/scan/permissions/camera-permission', () => ({
  getCameraPermissionSnapshot: jest.fn(),
  requestCameraPermissionSnapshot: jest.fn(),
}));

jest.mock('../src/features/scan/scan-haptics', () => ({
  triggerScanHaptics: jest.fn(),
}));

const storeRepository = require('../src/db/repositories/store-repository');
const recentScansRepository = require('../src/db/repositories/recent-scans-repository');
const cameraPermission = require('../src/features/scan/permissions/camera-permission');
const { ScanFeatureScreen } = require('../src/features/scan/scan-screen');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

function createPermissionSnapshot(overrides = {}) {
  return {
    status: 'undetermined',
    granted: false,
    canAskAgain: true,
    expires: 'never',
    isAvailable: true,
    ...overrides,
  };
}

describe('Story 2.5 Scan fallback and recent scans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
    mockCameraViewProps.current = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows fallback prompt after ~5s once camera is ready (AC1)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );
    recentScansRepository.listRecentScans.mockResolvedValue([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();
    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    await act(async () => {
      mockCameraViewProps.current.onCameraReady();
    });

    expect(screen.queryByTestId('scan-fallback-manual-entry')).toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() =>
      expect(screen.getByTestId('scan-fallback-manual-entry')).toBeTruthy()
    );
  });

  it('validates manual entry and navigates to Results (AC2)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );
    recentScansRepository.listRecentScans.mockResolvedValue([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();
    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    await act(async () => {
      mockCameraViewProps.current.onCameraReady();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() =>
      expect(screen.getByTestId('scan-fallback-manual-entry')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-fallback-manual-entry'));

    const manualInput = screen.getByTestId('scan-fallback-manual-input');
    const submitButton = screen.getByTestId('scan-fallback-manual-submit');

    fireEvent.press(submitButton);
    expect(mockRouterPush).not.toHaveBeenCalled();

    fireEvent.changeText(manualInput, 'bad');
    fireEvent.press(screen.getByTestId('scan-fallback-manual-submit'));
    expect(mockRouterPush).not.toHaveBeenCalled();

    fireEvent.changeText(manualInput, '0123456789012');
    fireEvent.press(screen.getByTestId('scan-fallback-manual-submit'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012' },
    });

    await waitFor(() =>
      expect(screen.queryByTestId('scan-fallback-manual-input')).toBeNull()
    );
  });

  it('records recent scans on successful scan (AC4)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );
    recentScansRepository.listRecentScans.mockResolvedValue([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();
    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    await act(async () => {
      mockCameraViewProps.current.onBarcodeScanned({ data: '0123456789012' });
    });

    expect(recentScansRepository.recordRecentScan).toHaveBeenCalledWith({
      barcode: '0123456789012',
      source: 'scan',
    });
  });

  it('renders recent scans list ordering and empty state (AC3)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );

    recentScansRepository.listRecentScans.mockResolvedValueOnce([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();
    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    await act(async () => {
      mockCameraViewProps.current.onCameraReady();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() =>
      expect(screen.getByTestId('scan-recent-scans-empty')).toBeTruthy()
    );

    recentScansRepository.listRecentScans.mockResolvedValueOnce([
      { id: 9, barcode: '000000000000', scannedAt: 1700000000000, source: 'scan' },
      { id: 8, barcode: '111111111111', scannedAt: 1690000000000, source: 'scan' },
    ]);

    fireEvent.press(screen.getByTestId('scan-recent-scans-refresh'));

    await waitFor(() => {
      const rows = screen.getAllByTestId(/scan-recent-scan-/);
      expect(rows[0].props.testID).toBe('scan-recent-scan-9');
      expect(rows[1].props.testID).toBe('scan-recent-scan-8');
    });
  });
});
