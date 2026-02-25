/* eslint-env jest */

const React = require('react');
const { render, fireEvent, waitFor, act } = require('@testing-library/react-native');

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

jest.mock('../src/db/repositories/store-repository', () => ({
  listStores: jest.fn(),
  createStore: jest.fn(),
  updateStoreName: jest.fn(),
  toggleStoreActive: jest.fn(),
  getActiveStoreCount: jest.fn(),
}));

const storeRepository = require('../src/db/repositories/store-repository');
const { StoresFeatureScreen } = require('../src/features/stores/stores-screen');
const { ScanFeatureScreen } = require('../src/features/scan/scan-screen');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

describe('Story 2.1 store setup and active gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
  });

  it('adds a store and shows it in the list (AC1)', async () => {
    storeRepository.listStores
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 1,
          name: 'Whole Foods',
          isActive: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ]);
    storeRepository.createStore.mockResolvedValue({
      id: 1,
      name: 'Whole Foods',
      isActive: true,
      createdAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(StoresFeatureScreen));

    await waitFor(() => expect(storeRepository.listStores).toHaveBeenCalledTimes(1));

    fireEvent.changeText(screen.getByTestId('store-name-input'), 'Whole Foods');
    fireEvent.press(screen.getByTestId('save-store-button'));

    await waitFor(() =>
      expect(storeRepository.createStore).toHaveBeenCalledWith({ name: 'Whole Foods' })
    );
    await waitFor(() => expect(screen.getByText('Whole Foods')).toBeTruthy());
  });

  it('edits an existing store name and shows the updated value (AC2)', async () => {
    storeRepository.listStores
      .mockResolvedValueOnce([
        { id: 1, name: 'Target', isActive: true, createdAt: 1, updatedAt: 1 },
      ])
      .mockResolvedValueOnce([
        { id: 1, name: 'Target Neighborhood Market', isActive: true, createdAt: 1, updatedAt: 2 },
      ]);
    storeRepository.updateStoreName.mockResolvedValue({
      id: 1,
      name: 'Target Neighborhood Market',
      isActive: true,
      createdAt: 1,
      updatedAt: 2,
    });

    const screen = render(React.createElement(StoresFeatureScreen));

    await waitFor(() => expect(screen.getByText('Target')).toBeTruthy());

    fireEvent.press(screen.getByTestId('store-row-1'));
    fireEvent.changeText(
      screen.getByTestId('edit-store-name-input'),
      'Target Neighborhood Market'
    );
    fireEvent.press(screen.getByTestId('save-edit-store-button'));

    await waitFor(() =>
      expect(storeRepository.updateStoreName).toHaveBeenCalledWith({
        id: 1,
        name: 'Target Neighborhood Market',
      })
    );
    await waitFor(() =>
      expect(screen.getByText('Target Neighborhood Market')).toBeTruthy()
    );
  });

  it('toggles active status and updates the row state label immediately after refresh (AC3)', async () => {
    storeRepository.listStores
      .mockResolvedValueOnce([
        { id: 2, name: 'Costco', isActive: true, createdAt: 1, updatedAt: 1 },
      ])
      .mockResolvedValueOnce([
        { id: 2, name: 'Costco', isActive: false, createdAt: 1, updatedAt: 2 },
      ]);
    storeRepository.toggleStoreActive.mockResolvedValue({
      id: 2,
      name: 'Costco',
      isActive: false,
      createdAt: 1,
      updatedAt: 2,
    });

    const screen = render(React.createElement(StoresFeatureScreen));

    await waitFor(() => expect(screen.getByText('Costco')).toBeTruthy());
    fireEvent(screen.getByTestId('store-active-switch-2'), 'valueChange', false);

    await waitFor(() =>
      expect(storeRepository.toggleStoreActive).toHaveBeenCalledWith({ id: 2, isActive: false })
    );
    await waitFor(() => expect(screen.getByText('Inactive')).toBeTruthy());
  });

  it('shows a calm scan gating state with CTA when no active stores exist (AC4)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(0);

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() =>
      expect(screen.getByText('Activate a store to start scanning')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-gate-manage-stores-button'));
    expect(mockRouterPush).toHaveBeenCalledWith('/stores');
  });

  it('shows scan-ready placeholder state when at least one active store exists (AC4)', async () => {
    storeRepository.getActiveStoreCount.mockResolvedValue(2);

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() => expect(screen.getByText('Scan is ready')).toBeTruthy());
    expect(
      screen.getByText(
        '2 active stores found. Camera capture UI will plug into this entry state in a later story.'
      )
    ).toBeTruthy();
  });

  it('re-checks scan gating when the screen regains focus after store changes (AC4 regression)', async () => {
    storeRepository.getActiveStoreCount
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);

    const screen = render(React.createElement(ScanFeatureScreen));

    await waitFor(() =>
      expect(screen.getByText('Activate a store to start scanning')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('scan-gate-manage-stores-button'));
    expect(mockRouterPush).toHaveBeenCalledWith('/stores');

    await triggerMockFocus();

    await waitFor(() => expect(screen.getByText('Scan is ready')).toBeTruthy());
    expect(storeRepository.getActiveStoreCount).toHaveBeenCalledTimes(2);
  });
});
