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
const { SHOPPING_LIST_QUANTITY_MAX } = require('../src/db/validation/shopping-list');

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('Story 3.2 shopping list UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockReset();
    shoppingListRepository.addOrIncrementShoppingListItem.mockReset();
    shoppingListRepository.listShoppingListItems.mockReset();
    shoppingListRepository.setShoppingListItemQuantity.mockReset();
    shoppingListRepository.toggleShoppingListItemChecked.mockReset();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
    mockLocalSearchParams = {};
  });

  it('increments quantity for duplicate add flow from Results (AC1)', async () => {
    mockLocalSearchParams = { barcode: '0123456789012' };
    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Spinach',
      stores: [],
    });
    let persistedQuantity = 0;
    shoppingListRepository.addOrIncrementShoppingListItem.mockImplementation(async (input) => {
      persistedQuantity += input.quantity;
      return {
        barcode: input.barcode,
        productName: input.productName,
        quantity: persistedQuantity,
        isChecked: false,
        createdAt: 1,
        updatedAt: 1,
      };
    });
    shoppingListRepository.listShoppingListItems.mockImplementation(async () => {
      if (persistedQuantity === 0) {
        return [];
      }
      return [
        {
          barcode: '0123456789012',
          productName: 'Spinach',
          quantity: persistedQuantity,
          isChecked: false,
          createdAt: 1,
          updatedAt: 1,
        },
      ];
    });

    const screen = render(React.createElement(ResultsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Spinach')).toBeTruthy());

    fireEvent.press(screen.getByTestId('results-add-to-list-button'));
    await waitFor(() => expect(screen.getByTestId('results-quantity-input')).toBeTruthy());
    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '1');
    fireEvent.press(screen.getByTestId('results-quantity-save'));
    await waitFor(() =>
      expect(shoppingListRepository.addOrIncrementShoppingListItem).toHaveBeenCalledTimes(1)
    );
    await waitFor(() => expect(screen.queryByTestId('results-quantity-input')).toBeNull());
    await waitFor(
      () =>
        expect(
          screen.getByTestId('results-add-to-list-button').props.accessibilityState?.disabled
        ).toBe(false)
    );

    fireEvent.press(screen.getByTestId('results-add-to-list-button'));
    await waitFor(() => expect(screen.getByTestId('results-quantity-input')).toBeTruthy());
    fireEvent.changeText(screen.getByTestId('results-quantity-input'), '1');
    fireEvent.press(screen.getByTestId('results-quantity-save'));

    await waitFor(() =>
      expect(shoppingListRepository.addOrIncrementShoppingListItem).toHaveBeenNthCalledWith(1, {
        barcode: '0123456789012',
        quantity: 1,
        productName: 'Spinach',
      })
    );
    await waitFor(() =>
      expect(shoppingListRepository.addOrIncrementShoppingListItem).toHaveBeenNthCalledWith(2, {
        barcode: '0123456789012',
        quantity: 1,
        productName: 'Spinach',
      })
    );

    screen.unmount();

    const listScreen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(listScreen.getByText('Qty 2')).toBeTruthy());
    expect(listScreen.queryAllByTestId('shopping-list-row-0123456789012')).toHaveLength(1);
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

  it('disables increment at max quantity boundary', async () => {
    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: 'max-item',
        productName: 'Paper Towels',
        quantity: SHOPPING_LIST_QUANTITY_MAX,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Paper Towels')).toBeTruthy());

    const increaseButton = screen.getByTestId('shopping-list-increase-max-item');
    expect(increaseButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(increaseButton);

    expect(shoppingListRepository.setShoppingListItemQuantity).not.toHaveBeenCalled();
    expect(screen.getByText(`Qty ${SHOPPING_LIST_QUANTITY_MAX}`)).toBeTruthy();
  });

  it('disables decrement at quantity floor', async () => {
    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: 'floor-item',
        productName: 'Milk',
        quantity: 1,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Milk')).toBeTruthy());

    const decreaseButton = screen.getByTestId('shopping-list-decrease-floor-item');
    expect(decreaseButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(decreaseButton);

    expect(shoppingListRepository.setShoppingListItemQuantity).not.toHaveBeenCalled();
    expect(screen.getByText('Qty 1')).toBeTruthy();
  });

  it('reconciles rapid quantity taps using latest target quantity', async () => {
    const firstWrite = createDeferred();

    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: 'rapid-qty',
        productName: 'Eggs',
        quantity: 2,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);
    shoppingListRepository.setShoppingListItemQuantity
      .mockImplementationOnce(() => firstWrite.promise)
      .mockResolvedValueOnce({
        barcode: 'rapid-qty',
        productName: 'Eggs',
        quantity: 4,
        isChecked: false,
        createdAt: 1,
        updatedAt: 3,
      });

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Eggs')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-increase-rapid-qty'));
    fireEvent.press(screen.getByTestId('shopping-list-increase-rapid-qty'));

    await waitFor(() =>
      expect(shoppingListRepository.setShoppingListItemQuantity).toHaveBeenNthCalledWith(1, {
        barcode: 'rapid-qty',
        quantity: 3,
      })
    );
    expect(screen.getByText('Qty 4')).toBeTruthy();

    await act(async () => {
      firstWrite.resolve({
        barcode: 'rapid-qty',
        productName: 'Eggs',
        quantity: 3,
        isChecked: false,
        createdAt: 1,
        updatedAt: 3,
      });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(shoppingListRepository.setShoppingListItemQuantity).toHaveBeenNthCalledWith(2, {
        barcode: 'rapid-qty',
        quantity: 4,
      })
    );
  });

  it('rolls back optimistic quantity updates when repository write fails', async () => {
    shoppingListRepository.listShoppingListItems
      .mockResolvedValueOnce([
        {
          barcode: 'rollback-qty',
          productName: 'Yogurt',
          quantity: 2,
          isChecked: false,
          createdAt: 1,
          updatedAt: 2,
        },
      ])
      .mockResolvedValueOnce([
        {
          barcode: 'rollback-qty',
          productName: 'Yogurt',
          quantity: 2,
          isChecked: false,
          createdAt: 1,
          updatedAt: 2,
        },
      ]);
    shoppingListRepository.setShoppingListItemQuantity.mockRejectedValueOnce(new Error('boom'));

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Yogurt')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-increase-rollback-qty'));

    await waitFor(() => expect(screen.getByText('Qty 3')).toBeTruthy());
    await waitFor(() => expect(shoppingListRepository.setShoppingListItemQuantity).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Qty 2')).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId('shopping-list-write-error').props.children).toContain(
        'Could not save quantity change.'
      )
    );
  });

  it('reconciles rapid toggle taps and persists final state', async () => {
    const firstToggleWrite = createDeferred();

    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: 'rapid-toggle',
        productName: 'Soda',
        quantity: 1,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);
    shoppingListRepository.toggleShoppingListItemChecked
      .mockImplementationOnce(() => firstToggleWrite.promise)
      .mockResolvedValueOnce({
        barcode: 'rapid-toggle',
        productName: 'Soda',
        quantity: 1,
        isChecked: false,
        createdAt: 1,
        updatedAt: 3,
      });

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Soda')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-toggle-rapid-toggle'));
    fireEvent.press(screen.getByTestId('shopping-list-toggle-rapid-toggle'));

    await waitFor(() =>
      expect(shoppingListRepository.toggleShoppingListItemChecked).toHaveBeenNthCalledWith(1, {
        barcode: 'rapid-toggle',
        isChecked: true,
      })
    );
    expect(screen.getByText('Not in cart')).toBeTruthy();

    await act(async () => {
      firstToggleWrite.resolve({
        barcode: 'rapid-toggle',
        productName: 'Soda',
        quantity: 1,
        isChecked: true,
        createdAt: 1,
        updatedAt: 3,
      });
      await Promise.resolve();
    });

    await waitFor(() =>
      expect(shoppingListRepository.toggleShoppingListItemChecked).toHaveBeenNthCalledWith(2, {
        barcode: 'rapid-toggle',
        isChecked: false,
      })
    );
  });

  it('rolls back optimistic checked toggles when repository write fails', async () => {
    shoppingListRepository.listShoppingListItems
      .mockResolvedValueOnce([
        {
          barcode: 'rollback-toggle',
          productName: 'Coffee',
          quantity: 1,
          isChecked: false,
          createdAt: 1,
          updatedAt: 2,
        },
      ])
      .mockResolvedValueOnce([
        {
          barcode: 'rollback-toggle',
          productName: 'Coffee',
          quantity: 1,
          isChecked: false,
          createdAt: 1,
          updatedAt: 2,
        },
      ]);
    shoppingListRepository.toggleShoppingListItemChecked.mockRejectedValueOnce(
      new Error('toggle failed')
    );

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Coffee')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-toggle-rollback-toggle'));

    await waitFor(() => expect(screen.getByText('In cart')).toBeTruthy());
    await waitFor(() =>
      expect(shoppingListRepository.toggleShoppingListItemChecked).toHaveBeenCalled()
    );
    await waitFor(() => expect(screen.getByText('Not in cart')).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByTestId('shopping-list-write-error').props.children).toContain(
        'Could not update checked state.'
      )
    );
  });
});
