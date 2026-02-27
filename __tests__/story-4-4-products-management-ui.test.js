/* eslint-env jest */

const React = require('react');
const { render, fireEvent, waitFor } = require('@testing-library/react-native');

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
      green9: { val: '#2fb550' },
      green10: { val: '#29a74a' },
      shadowColor: { val: '#00000022' },
    }),
  };
});

jest.mock('../src/db/repositories/product-repository', () => ({
  listProducts: jest.fn(),
  setProductActive: jest.fn(),
}));

jest.mock('../src/db/repositories/store-repository', () => ({
  listStores: jest.fn(),
}));

jest.mock('../src/db/repositories/pricing-repository', () => ({
  saveStorePrice: jest.fn(),
  getResultsByBarcodeAcrossActiveStores: jest.fn(),
}));

jest.mock('../src/features/scan/permissions/camera-permission', () => ({
  getCameraPermissionSnapshot: jest.fn(),
  requestCameraPermissionSnapshot: jest.fn(),
}));

jest.mock('../src/features/scan/scan-camera', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');

  return {
    ScanCamera: ({ onBarcodeScanned }) =>
      React.createElement(
        Pressable,
        {
          testID: 'mock-products-scan-camera-trigger',
          onPress: () => onBarcodeScanned({ data: '987654321098' }),
        },
        React.createElement(Text, null, 'Mock Scan Camera')
      ),
  };
});

const productRepository = require('../src/db/repositories/product-repository');
const storeRepository = require('../src/db/repositories/store-repository');
const pricingRepository = require('../src/db/repositories/pricing-repository');
const cameraPermission = require('../src/features/scan/permissions/camera-permission');
const { ProductsFeatureScreen } = require('../src/features/products/products-screen');

describe('Story 4.4 products navigation and management UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storeRepository.listStores.mockResolvedValue([
      { id: 1, name: 'Abreeza', isActive: true, createdAt: 1, updatedAt: 1 },
      { id: 2, name: 'Citygate', isActive: true, createdAt: 1, updatedAt: 1 },
    ]);
    cameraPermission.getCameraPermissionSnapshot.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
      isAvailable: true,
    });
    cameraPermission.requestCameraPermissionSnapshot.mockResolvedValue({
      status: 'granted',
      granted: true,
      canAskAgain: true,
      expires: 'never',
      isAvailable: true,
    });
  });

  it('shows products and supports searching by name or barcode', async () => {
    productRepository.listProducts
      .mockResolvedValueOnce([
        {
          barcode: '0123456789012',
          name: 'Greek Yogurt',
          isActive: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          barcode: '0123456789012',
          name: 'Greek Yogurt',
          isActive: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ]);

    const screen = render(React.createElement(ProductsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Greek Yogurt')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('products-search-input'), '0123456789012');

    await waitFor(() =>
      expect(productRepository.listProducts).toHaveBeenLastCalledWith({
        query: '0123456789012',
        includeInactive: true,
      })
    );
  });

  it('adds with price/store, edits with price/store, and inactivates products', async () => {
    productRepository.listProducts
      .mockResolvedValueOnce([
        {
          barcode: '0123456789012',
          name: 'Greek Yogurt',
          isActive: true,
          createdAt: 1,
          updatedAt: 1,
        },
      ])
      .mockResolvedValue([
        {
          barcode: '0123456789012',
          name: 'Greek Yogurt Plain',
          isActive: true,
          createdAt: 1,
          updatedAt: 2,
        },
      ]);

    pricingRepository.getResultsByBarcodeAcrossActiveStores.mockResolvedValue({
      barcode: '0123456789012',
      productName: 'Greek Yogurt',
      stores: [
        { storeId: 1, storeName: 'Abreeza', isActive: true, priceCents: 349, capturedAt: 1, priceUpdatedAt: 1 },
        { storeId: 2, storeName: 'Citygate', isActive: true, priceCents: 379, capturedAt: 1, priceUpdatedAt: 1 },
      ],
    });

    const screen = render(React.createElement(ProductsFeatureScreen));

    await waitFor(() => expect(screen.getByText('Greek Yogurt')).toBeTruthy());

    fireEvent.press(screen.getByTestId('products-open-add-sheet-button'));
    fireEvent.changeText(screen.getByTestId('products-add-barcode-input'), '123456789012');
    fireEvent.changeText(screen.getByTestId('products-add-name-input'), 'Milk');
    fireEvent.changeText(screen.getByTestId('products-add-price-input'), '4.99');
    fireEvent.press(screen.getByTestId('products-add-store-option-2'));
    fireEvent.press(screen.getByTestId('products-add-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '123456789012',
        productName: 'Milk',
        storeId: 2,
        priceCents: 499,
      })
    );

    fireEvent(screen.getByTestId('product-active-switch-0123456789012'), 'onPress');

    await waitFor(() =>
      expect(productRepository.setProductActive).toHaveBeenCalledWith({
        barcode: '0123456789012',
        isActive: false,
      })
    );

    fireEvent.press(screen.getByTestId('product-row-0123456789012'));

    await waitFor(() =>
      expect(pricingRepository.getResultsByBarcodeAcrossActiveStores).toHaveBeenCalledWith({
        barcode: '0123456789012',
      })
    );

    fireEvent.press(screen.getByTestId('products-edit-store-option-2'));
    fireEvent.changeText(screen.getByTestId('products-edit-name-input'), 'Greek Yogurt Plain');
    fireEvent.changeText(screen.getByTestId('products-edit-price-input'), '3.99');
    fireEvent.press(screen.getByTestId('products-edit-save-button'));

    await waitFor(() =>
      expect(pricingRepository.saveStorePrice).toHaveBeenCalledWith({
        barcode: '0123456789012',
        productName: 'Greek Yogurt Plain',
        storeId: 2,
        priceCents: 399,
      })
    );

  });

  it('opens scanner and writes scanned barcode into the barcode input', async () => {
    productRepository.listProducts.mockResolvedValue([]);
    const screen = render(React.createElement(ProductsFeatureScreen));

    await waitFor(() =>
      expect(screen.getByTestId('products-open-add-sheet-button')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('products-open-add-sheet-button'));

    await waitFor(() =>
      expect(screen.getByTestId('products-add-barcode-scan-trigger')).toBeTruthy()
    );

    fireEvent.press(screen.getByTestId('products-add-barcode-scan-trigger'));

    await waitFor(() =>
      expect(cameraPermission.getCameraPermissionSnapshot).toHaveBeenCalled()
    );

    fireEvent.press(screen.getByTestId('mock-products-scan-camera-trigger'));

    await waitFor(() =>
      expect(screen.getByTestId('products-add-barcode-input').props.value).toBe('987654321098')
    );
  });
});
