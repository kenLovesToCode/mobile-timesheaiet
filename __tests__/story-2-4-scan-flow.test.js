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

jest.mock('../src/features/scan/permissions/camera-permission', () => ({
  getCameraPermissionSnapshot: jest.fn(),
  requestCameraPermissionSnapshot: jest.fn(),
}));

jest.mock('../src/features/scan/scan-haptics', () => ({
  triggerScanHaptics: jest.fn(),
}));

const storeRepository = require('../src/db/repositories/store-repository');
const cameraPermission = require('../src/features/scan/permissions/camera-permission');
const scanHaptics = require('../src/features/scan/scan-haptics');
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

describe('Story 2.4 Scan flow with haptics and torch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
    mockCameraViewProps.current = null;
  });

  it('renders permission granted state with camera UI (AC1, AC2)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByText('Scan is ready')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());
  });

  it('shows denied state with manual entry path when permission is blocked (AC5)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'denied', granted: false, canAskAgain: false })
    );

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByText('Camera access is denied')).toBeTruthy());
    const manualEntryInput = screen.getByTestId('scan-manual-entry-input');
    const manualEntrySubmit = screen.getByTestId('scan-manual-entry-submit');
    expect(manualEntrySubmit.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(manualEntryInput, '0123456789012');
    await waitFor(() =>
      expect(screen.getByTestId('scan-manual-entry-submit').props.accessibilityState?.disabled).toBe(
        false
      )
    );

    fireEvent.press(screen.getByTestId('scan-manual-entry-submit'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012', source: 'scan' },
    });
  });

  it('shows an error state when permission lookup fails (AC5)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockRejectedValue(new Error('boom'));

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByText('Camera status unavailable')).toBeTruthy());
    expect(screen.getByTestId('scan-permission-retry-button')).toBeTruthy();
  });

  it('navigates on first barcode scan and latches duplicates (AC1, AC3, AC4)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    await act(async () => {
      mockCameraViewProps.current.onBarcodeScanned({ data: '  0123-4567-89012  ' });
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012', source: 'scan' },
    });
    expect(scanHaptics.triggerScanHaptics).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockCameraViewProps.current.onBarcodeScanned({ data: 'not-a-barcode' });
    });

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(scanHaptics.triggerScanHaptics).toHaveBeenCalledTimes(1);

    await triggerMockFocus();
  });

  it('does not latch invalid scans before a valid barcode', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    await act(async () => {
      mockCameraViewProps.current.onBarcodeScanned({ data: 'not-a-barcode' });
    });

    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(scanHaptics.triggerScanHaptics).not.toHaveBeenCalled();

    await act(async () => {
      mockCameraViewProps.current.onBarcodeScanned({ data: '0123456789012' });
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012' },
    });
    expect(scanHaptics.triggerScanHaptics).toHaveBeenCalledTimes(1);
  });

  it('wires torch toggle state into the camera props (AC5)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ status: 'granted', granted: true })
    );

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('mock-camera-view')).toBeTruthy());

    fireEvent.press(screen.getByTestId('scan-torch-toggle'));

    await waitFor(() => expect(mockCameraViewProps.current.enableTorch).toBe(true));
  });
});
