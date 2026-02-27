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

describe('Story 3.1 shopping list UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
    mockLocalSearchParams = {};
  });

  it('allows adding to list with quantity from Results (AC1)', async () => {
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

  it('enforces integer quantity before saving (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [],
    });
    shoppingListRepository.addOrIncrementShoppingListItem.mockResolvedValue({});

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Spinach')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-add-to-list-button'));
    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '0');
    fireEvent.press(screen.getByTestId('results-quantity-save'));

    await waitFor(() =>
      expect(screen.getByTestId('results-add-to-list-error')).toBeTruthy()
    );

    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '3');
    fireEvent.press(screen.getByTestId('results-quantity-save'));

    await waitFor(() =>
      expect(shoppingListRepository.addOrIncrementShoppingListItem).toHaveBeenCalledWith({
        barcode: '0123456789012',
        quantity: 3,
        productName: 'Spinach',
      })
    );
  });

  it('disables Add to List until Results is ready (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    let resolveResults;
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResults = resolve;
      })
    );

    const screen = render(React.createElement(ResultsFeatureScreen));

    expect(screen.getByTestId('results-add-to-list-button')).toBeDisabled();

    await act(async () => {
      resolveResults({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [],
      });
    });

    await waitFor(() => expect(screen.getByText('Spinach')).toBeTruthy());
    expect(screen.getByTestId('results-add-to-list-button')).not.toBeDisabled();
  });

  it('clears add-to-list success when barcode changes (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores
      .mockResolvedValueOnce({
        barcode: '0123456789012',
        productName: 'Spinach',
        stores: [],
      })
      .mockResolvedValueOnce({
        barcode: '5555555555555',
        productName: 'Peppers',
        stores: [],
      });
    shoppingListRepository.addOrIncrementShoppingListItem.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      quantity: 1,
      isChecked: false,
      createdAt: 1,
      updatedAt: 1,
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Spinach')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-add-to-list-button'));
    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '1');
    fireEvent.press(screen.getByTestId('results-quantity-save'));

    await waitFor(() =>
      expect(screen.getByTestId('results-add-to-list-success')).toBeTruthy()
    );

    mockLocalSearchParams = { barcode: '5555555555555' };
    screen.rerender(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Peppers')).toBeTruthy());
    await waitFor(() =>
      expect(screen.queryByTestId('results-add-to-list-success')).toBeNull()
    );
  });

  it('shows add-to-list error messaging when save fails (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [],
    });
    shoppingListRepository.addOrIncrementShoppingListItem.mockRejectedValue(
      new Error('DB is unavailable')
    );

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Spinach')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-add-to-list-button'));
    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '2');
    fireEvent.press(screen.getByTestId('results-quantity-save'));

    await waitFor(() =>
      expect(screen.getByTestId('results-add-to-list-error')).toBeTruthy()
    );
  });

  it('avoids state updates after unmount while loading Shopping List (AC2)', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    let resolveItems;
    shoppingListRepository.listShoppingListItems.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveItems = resolve;
      })
    );

    const screen = render(React.createElement(ShoppingListFeatureScreen));

    screen.unmount();

    await act(async () => {
      resolveItems([]);
    });

    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("Can't perform a React state update")
    );
    consoleError.mockRestore();
  });

  it('renders Shopping List items with quantity and empty state CTA (AC2)', async () => {
    shoppingListRepository.listShoppingListItems
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
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

    await waitFor(() => expect(screen.getByTestId('shopping-list-empty')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-scan-button'));
    expect(mockRouterPush).toHaveBeenCalledWith('/scan');

    await triggerMockFocus();

    await waitFor(() => expect(screen.getByText('Apples')).toBeTruthy());
    expect(screen.getByText('Qty 2')).toBeTruthy();
  });
});
