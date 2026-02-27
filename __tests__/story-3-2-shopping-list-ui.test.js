/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockFocusEffects = new Set();
let mockLocalSearchParams = {};

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

jest.mock('../src/db/repositories/shopping-list-repository', () => ({
  addOrIncrementShoppingListItem: jest.fn(),
  listShoppingListItems: jest.fn(),
  setShoppingListItemQuantity: jest.fn(),
  toggleShoppingListItemChecked: jest.fn(),
}));

const pricingRepository = require('../src/db/repositories/pricing-repository');
const shoppingListRepository = require('../src/db/repositories/shopping-list-repository');
const { ResultsFeatureScreen } = require('../src/features/results/results-screen');
const { ShoppingListFeatureScreen } = require('../src/features/shopping-list/shopping-list-screen');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

describe('Story 3.2 shopping list UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
    mockLocalSearchParams = {};
  });

  it('uses increment add flow from Results (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [],
    });
    shoppingListRepository.addOrIncrementShoppingListItem.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      quantity: 2,
      isChecked: false,
      createdAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Spinach')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-add-to-list-button'));
    await waitFor(() => expect(screen.getByTestId('results-quantity-input')).toBeTruthy());
    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '2');
    fireEvent.press(screen.getByTestId('results-quantity-save'));

    await waitFor(() =>
      expect(shoppingListRepository.addOrIncrementShoppingListItem).toHaveBeenCalledWith({
        barcode: '0123456789012',
        quantity: 2,
        productName: 'Spinach',
      })
    );
  });

  it('updates quantity and checked state from Shopping List (AC2)', async () => {
    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: '111',
        productName: 'Apples',
        quantity: 2,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);

    const screen = render(React.createElement(ShoppingListFeatureScreen));

    await waitFor(() => expect(screen.getByText('Apples')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-increase-111'));

    await waitFor(() =>
      expect(shoppingListRepository.setShoppingListItemQuantity).toHaveBeenCalledWith({
        barcode: '111',
        quantity: 3,
      })
    );
    await waitFor(() => expect(screen.getByText('Qty 3')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-toggle-111'));

    await waitFor(() =>
      expect(shoppingListRepository.toggleShoppingListItemChecked).toHaveBeenCalledWith({
        barcode: '111',
        isChecked: true,
      })
    );
    await waitFor(() => expect(screen.getByText('In cart')).toBeTruthy());

    await triggerMockFocus();
  });
});
