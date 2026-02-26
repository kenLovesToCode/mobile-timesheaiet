/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockFocusEffects = new Set();

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
    CameraView: (props) => React.createElement(View, { testID: 'mock-camera-view' }, props.children),
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

describe('Story 2.6 Permission denied and empty state handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
  });

  it('shows fallback UI and hides camera when permission is denied (AC1, AC5)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ granted: false, canAskAgain: false })
    );
    recentScansRepository.listRecentScans.mockResolvedValue([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.getByTestId('scan-fallback-manual-entry')).toBeTruthy()
    );
    expect(screen.queryByTestId('mock-camera-view')).toBeNull();
    expect(recentScansRepository.listRecentScans).toHaveBeenCalled();
  });

  it('navigates to Results from manual entry when permission is unavailable (AC2)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ isAvailable: false })
    );
    recentScansRepository.listRecentScans.mockResolvedValue([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.getByTestId('scan-fallback-manual-entry')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-fallback-manual-entry'));
    const manualInput = screen.getByTestId('scan-fallback-manual-input');

    fireEvent.changeText(manualInput, 'bad');
    fireEvent.press(screen.getByTestId('scan-fallback-manual-submit'));
    expect(mockRouterPush).not.toHaveBeenCalled();

    fireEvent.changeText(manualInput, '0123456789012');
    fireEvent.press(screen.getByTestId('scan-fallback-manual-submit'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/results',
      params: { barcode: '0123456789012' },
    });
  });

  it('shows an empty state CTA to manual entry when no recent scans exist (AC4)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(1);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue(
      createPermissionSnapshot({ granted: false, canAskAgain: false })
    );
    recentScansRepository.listRecentScans.mockResolvedValue([]);

    const screen = render(React.createElement(ScanFeatureScreen));

    await triggerMockFocus();

    await waitFor(() =>
      expect(screen.getByTestId('scan-recent-scans-empty')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-recent-scans-empty-manual-entry'));

    await waitFor(() =>
      expect(screen.getByTestId('scan-fallback-manual-input')).toBeTruthy()
    );
  });
});
