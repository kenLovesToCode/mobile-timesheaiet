/* eslint-env jest */

const React = require('react');
const { fireEvent, render, waitFor } = require('@testing-library/react-native');

jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const Modal = ({ children, visible }) =>
    visible ? React.createElement(React.Fragment, null, children) : null;
  return { __esModule: true, default: Modal };
});

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
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (effect) => {
    const React = require('react');
    React.useEffect(() => effect(), [effect]);
  },
}));

jest.mock('../src/db/repositories/shopping-list-repository', () => ({
  listShoppingListItems: jest.fn(),
  setShoppingListItemQuantity: jest.fn(),
  toggleShoppingListItemChecked: jest.fn(),
}));

const {
  SHOPPING_LIST_OPEN_P95_BUDGET_MS,
  __resetShoppingListOpenMeasurementsForTests,
  getShoppingListOpenSummary,
} = require('../src/features/shopping-list/shopping-list-performance');
const shoppingListRepository = require('../src/db/repositories/shopping-list-repository');
const { ShoppingListFeatureScreen } = require('../src/features/shopping-list/shopping-list-screen');

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

describe('Story 3.3 shopping list performance evidence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shoppingListRepository.listShoppingListItems.mockReset();
    __resetShoppingListOpenMeasurementsForTests();
  });

  it('records runtime open-to-visible measurements through screen flow and keeps p95 within budget (AC2)', async () => {
    const measuredDelaysMs = [
      28, 31, 34, 29, 33,
      30, 36, 38, 35, 32,
      34, 37, 39, 41, 43,
      40, 44, 46, 42, 45,
      47, 49, 52, 50, 48,
    ];
    let runIndex = 0;

    shoppingListRepository.listShoppingListItems.mockImplementation(async () => {
      const delayMs = measuredDelaysMs[Math.min(runIndex, measuredDelaysMs.length - 1)];
      const barcode = `perf-${runIndex}`;
      runIndex += 1;
      await delay(delayMs);

      return [
        {
          barcode,
          productName: `Item ${barcode}`,
          quantity: 1,
          isChecked: false,
          createdAt: runIndex,
          updatedAt: runIndex,
        },
      ];
    });

    for (let i = 0; i < measuredDelaysMs.length; i += 1) {
      const screen = render(React.createElement(ShoppingListFeatureScreen));
      await waitFor(() => expect(screen.getByTestId(`shopping-list-row-perf-${i}`)).toBeTruthy(), {
        timeout: 2000,
      });
      expect(getShoppingListOpenSummary().count).toBe(i);
      fireEvent(screen.getByTestId('shopping-list-ready-container'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 640 } },
      });
      await waitFor(() => expect(getShoppingListOpenSummary().count).toBe(i + 1));
      screen.unmount();
    }

    const summary = getShoppingListOpenSummary();
    expect(summary.count).toBe(measuredDelaysMs.length);
    expect(summary.p95Ms).not.toBeNull();
    expect(summary.p95Ms).toBeLessThanOrEqual(SHOPPING_LIST_OPEN_P95_BUDGET_MS);
    expect(summary.latestSample?.durationMs ?? 0).toBeGreaterThan(0);
  });

  it('does not add open-time samples for retry refresh loads', async () => {
    shoppingListRepository.listShoppingListItems
      .mockRejectedValueOnce(new Error('transient load failure'))
      .mockResolvedValueOnce([
        {
          barcode: 'retry-1',
          productName: 'Retry item',
          quantity: 1,
          isChecked: false,
          createdAt: 1,
          updatedAt: 1,
        },
      ]);

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('shopping-list-retry-button')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-retry-button'));
    await waitFor(() => expect(screen.getByTestId('shopping-list-row-retry-1')).toBeTruthy());
    fireEvent(screen.getByTestId('shopping-list-ready-container'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 640 } },
    });

    const summary = getShoppingListOpenSummary();
    expect(summary.count).toBe(0);
  });
});
