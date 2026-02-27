/* eslint-env jest */

const React = require('react');
const { act, fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockRouterPush = jest.fn();
const mockFocusEffects = new Set();

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

jest.mock('../src/db/repositories/shopping-list-repository', () => ({
  listShoppingListItems: jest.fn(),
  setShoppingListItemQuantity: jest.fn(),
  toggleShoppingListItemChecked: jest.fn(),
}));

const shoppingListRepository = require('../src/db/repositories/shopping-list-repository');
const { ShoppingListFeatureScreen } = require('../src/features/shopping-list/shopping-list-screen');

function collectRowOrder(tree, rows = []) {
  if (!tree) {
    return rows;
  }

  if (Array.isArray(tree)) {
    for (const child of tree) {
      collectRowOrder(child, rows);
    }
    return rows;
  }

  const testId = tree.props?.testID;
  if (typeof testId === 'string' && testId.startsWith('shopping-list-row-')) {
    rows.push(testId);
  }

  collectRowOrder(tree.children, rows);
  return rows;
}

async function triggerMockFocus() {
  await act(async () => {
    for (const effect of [...mockFocusEffects]) {
      effect();
    }
  });
}

describe('Story 3.3 shopping list UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    shoppingListRepository.listShoppingListItems.mockReset();
    shoppingListRepository.setShoppingListItemQuantity.mockReset();
    shoppingListRepository.toggleShoppingListItemChecked.mockReset();
    mockRouterPush.mockReset();
    mockFocusEffects.clear();
  });

  it('shows quantity and checked status for every loaded row (AC1)', async () => {
    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: '111',
        productName: 'Apples',
        quantity: 2,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
      {
        barcode: '222',
        productName: 'Bananas',
        quantity: 5,
        isChecked: true,
        createdAt: 2,
        updatedAt: 3,
      },
    ]);

    const screen = render(React.createElement(ShoppingListFeatureScreen));

    await waitFor(() => expect(screen.getByTestId('shopping-list-row-111')).toBeTruthy());
    expect(screen.getByTestId('shopping-list-row-222')).toBeTruthy();
    expect(screen.getByText('Qty 2')).toBeTruthy();
    expect(screen.getByText('Qty 5')).toBeTruthy();
    expect(screen.getByText('Not in cart')).toBeTruthy();
    expect(screen.getByText('In cart')).toBeTruthy();
  });

  it('applies checked state immediately and preserves it after refocus reload (AC3)', async () => {
    let persistedChecked = false;
    shoppingListRepository.listShoppingListItems.mockImplementation(async () => [
      {
        barcode: '111',
        productName: 'Apples',
        quantity: 2,
        isChecked: persistedChecked,
        createdAt: 1,
        updatedAt: 2,
      },
    ]);
    shoppingListRepository.toggleShoppingListItemChecked.mockImplementation(async ({ isChecked }) => {
      persistedChecked = isChecked;
      return {
        barcode: '111',
        productName: 'Apples',
        quantity: 2,
        isChecked,
        createdAt: 1,
        updatedAt: 3,
      };
    });

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByText('Not in cart')).toBeTruthy());

    fireEvent.press(screen.getByTestId('shopping-list-toggle-111'));

    await waitFor(() => expect(screen.getByText('In cart')).toBeTruthy());
    await waitFor(() =>
      expect(shoppingListRepository.toggleShoppingListItemChecked).toHaveBeenCalledWith({
        barcode: '111',
        isChecked: true,
      })
    );

    await triggerMockFocus();
    await waitFor(() => expect(screen.getByText('In cart')).toBeTruthy());
  });

  it('uses explicit accessibility semantics for in-cart toggles', async () => {
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
    await waitFor(() => expect(screen.getByTestId('shopping-list-toggle-111')).toBeTruthy());

    const toggle = screen.getByTestId('shopping-list-toggle-111');
    expect(toggle.props.accessibilityRole).toBe('switch');
    expect(toggle.props.accessibilityState).toMatchObject({ checked: false });
    expect(toggle.props.accessibilityLabel).toBe('Mark Apples as in cart');
  });

  it('keeps row ordering stable after checked-state changes', async () => {
    shoppingListRepository.listShoppingListItems.mockResolvedValue([
      {
        barcode: '111',
        productName: 'Apples',
        quantity: 2,
        isChecked: false,
        createdAt: 1,
        updatedAt: 2,
      },
      {
        barcode: '222',
        productName: 'Bananas',
        quantity: 1,
        isChecked: false,
        createdAt: 2,
        updatedAt: 3,
      },
      {
        barcode: '333',
        productName: 'Carrots',
        quantity: 4,
        isChecked: true,
        createdAt: 3,
        updatedAt: 4,
      },
    ]);
    shoppingListRepository.toggleShoppingListItemChecked.mockResolvedValue({
      barcode: '222',
      productName: 'Bananas',
      quantity: 1,
      isChecked: true,
      createdAt: 2,
      updatedAt: 5,
    });

    const screen = render(React.createElement(ShoppingListFeatureScreen));
    await waitFor(() => expect(screen.getByTestId('shopping-list-row-111')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('shopping-list-row-222')).toBeTruthy());
    await waitFor(() => expect(screen.getByTestId('shopping-list-row-333')).toBeTruthy());

    const beforeOrder = collectRowOrder(screen.toJSON());
    expect(beforeOrder).toEqual([
      'shopping-list-row-111',
      'shopping-list-row-222',
      'shopping-list-row-333',
    ]);

    fireEvent.press(screen.getByTestId('shopping-list-toggle-222'));
    await waitFor(() =>
      expect(shoppingListRepository.toggleShoppingListItemChecked).toHaveBeenCalledWith({
        barcode: '222',
        isChecked: true,
      })
    );

    const afterOrder = collectRowOrder(screen.toJSON());
    expect(afterOrder).toEqual(beforeOrder);
  });
});
