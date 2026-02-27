import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'tamagui';
import type { BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ListRow } from '../../components/ui/list-row';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import {
  listProducts,
  setProductActive,
  type ProductListItem,
} from '../../db/repositories/product-repository';
import {
  getResultsByBarcodeAcrossActiveStores,
  saveStorePrice,
} from '../../db/repositories/pricing-repository';
import { listStores, type StoreListItem } from '../../db/repositories/store-repository';
import { PricingValidationError } from '../../db/validation/pricing';
import {
  getCameraPermissionSnapshot,
  requestCameraPermissionSnapshot,
  type CameraPermissionSnapshot,
} from '../scan/permissions/camera-permission';
import { ScanCamera } from '../scan/scan-camera';
import { normalizeBarcodeValue } from '../scan/scan-barcode';
import { spacing } from '../../theme/tokens';

type CameraPermissionState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: CameraPermissionSnapshot }
  | { status: 'request'; snapshot: CameraPermissionSnapshot }
  | { status: 'denied'; snapshot: CameraPermissionSnapshot }
  | { status: 'unavailable'; snapshot: CameraPermissionSnapshot }
  | { status: 'error' };

type ProductSheetMode = 'add' | 'edit' | null;

function formatCentsForInput(priceCents: number | null): string {
  if (priceCents == null || Number.isNaN(priceCents)) {
    return '';
  }

  return (priceCents / 100).toFixed(2);
}

function parsePriceInputToCents(input: string): number | null {
  const normalized = input.trim();

  if (!normalized) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value * 100);
}

export function ProductsFeatureScreen() {
  const theme = useTheme();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [screenError, setScreenError] = useState<string | null>(null);

  const [sheetMode, setSheetMode] = useState<ProductSheetMode>(null);

  const [addBarcode, setAddBarcode] = useState('');
  const [addName, setAddName] = useState('');
  const [addPriceInput, setAddPriceInput] = useState('');
  const [selectedAddStoreId, setSelectedAddStoreId] = useState<number | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const [editingBarcode, setEditingBarcode] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriceInput, setEditPriceInput] = useState('');
  const [selectedEditStoreId, setSelectedEditStoreId] = useState<number | null>(null);
  const [editPriceByStoreId, setEditPriceByStoreId] = useState<Record<number, number | null>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isPreparingEditSheet, setIsPreparingEditSheet] = useState(false);

  const [busyBarcode, setBusyBarcode] = useState<string | null>(null);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannerPermissionState, setScannerPermissionState] = useState<CameraPermissionState>({
    status: 'loading',
  });

  const activeStores = useMemo(() => stores.filter((store) => store.isActive), [stores]);

  function mapPermissionSnapshot(snapshot: CameraPermissionSnapshot): CameraPermissionState {
    if (!snapshot.isAvailable) {
      return { status: 'unavailable', snapshot };
    }

    if (snapshot.granted) {
      return { status: 'ready', snapshot };
    }

    if (snapshot.canAskAgain) {
      return { status: 'request', snapshot };
    }

    return { status: 'denied', snapshot };
  }

  const loadScannerPermissionState = useCallback(async () => {
    setScannerPermissionState({ status: 'loading' });

    try {
      const snapshot = await getCameraPermissionSnapshot();
      setScannerPermissionState(mapPermissionSnapshot(snapshot));
    } catch (error) {
      console.error('[products] Failed to load camera permission status', error);
      setScannerPermissionState({ status: 'error' });
    }
  }, []);

  const requestScannerPermission = useCallback(async () => {
    setScannerPermissionState({ status: 'loading' });

    try {
      const snapshot = await requestCameraPermissionSnapshot();
      setScannerPermissionState(mapPermissionSnapshot(snapshot));
    } catch (error) {
      console.error('[products] Failed to request camera permission', error);
      setScannerPermissionState({ status: 'error' });
    }
  }, []);

  const openBarcodeScanner = useCallback(() => {
    setIsBarcodeScannerOpen(true);
    void loadScannerPermissionState();
  }, [loadScannerPermissionState]);

  const closeBarcodeScanner = useCallback(() => {
    setIsBarcodeScannerOpen(false);
  }, []);

  const handleScannerBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const barcode = normalizeBarcodeValue(result?.data);

      if (!barcode) {
        return;
      }

      setAddBarcode(barcode);
      closeBarcodeScanner();
    },
    [closeBarcodeScanner]
  );

  function resetAddForm() {
    setAddBarcode('');
    setAddName('');
    setAddPriceInput('');
    setAddError(null);
    setIsBarcodeScannerOpen(false);
  }

  function closeSheet() {
    setSheetMode(null);
    setIsBarcodeScannerOpen(false);

    if (sheetMode === 'edit') {
      setEditingBarcode(null);
      setEditName('');
      setEditPriceInput('');
      setEditPriceByStoreId({});
      setEditError(null);
      setIsPreparingEditSheet(false);
      return;
    }

    setAddError(null);
  }

  async function loadStores() {
    try {
      const rows = await listStores();
      setStores(rows);
      const active = rows.filter((store) => store.isActive);
      const firstActiveStoreId = active[0]?.id ?? null;

      setSelectedAddStoreId((currentValue) => {
        if (currentValue != null && active.some((store) => store.id === currentValue)) {
          return currentValue;
        }

        return firstActiveStoreId;
      });

      setSelectedEditStoreId((currentValue) => {
        if (currentValue != null && active.some((store) => store.id === currentValue)) {
          return currentValue;
        }

        return firstActiveStoreId;
      });
    } catch (error) {
      console.error('[products] Failed to load stores', error);
      setScreenError('Could not load stores right now.');
    }
  }

  async function loadProducts(searchQuery: string) {
    try {
      const rows = await listProducts({ query: searchQuery, includeInactive: true });
      setProducts(rows);
    } catch (error) {
      console.error('[products] Failed to load products', error);
      setScreenError('Could not load products right now.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStores();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setScreenError(null);
    void loadProducts(query);
  }, [query]);

  function openAddSheet() {
    resetAddForm();
    setSheetMode('add');
  }

  async function handleAddProduct() {
    if (isAddingProduct) {
      return;
    }

    setAddError(null);
    setScreenError(null);
    setIsAddingProduct(true);

    try {
      const priceCents = parsePriceInputToCents(addPriceInput);

      if (selectedAddStoreId == null) {
        setAddError('Select an active store before saving.');
        return;
      }

      if (priceCents == null) {
        setAddError('Enter a valid price (for example 3.99).');
        return;
      }

      await saveStorePrice({
        barcode: addBarcode,
        productName: addName,
        storeId: selectedAddStoreId,
        priceCents,
      });

      resetAddForm();
      setSheetMode(null);
      await loadProducts(query);
    } catch (error) {
      if (error instanceof PricingValidationError) {
        setAddError(error.message);
        return;
      }

      console.error('[products] Failed to save product pricing', error);
      setScreenError('Could not save product right now.');
    } finally {
      setIsAddingProduct(false);
    }
  }

  async function startEditing(product: ProductListItem) {
    setSheetMode('edit');
    setEditingBarcode(product.barcode);
    setEditName(product.name ?? '');
    setEditError(null);
    setIsPreparingEditSheet(true);

    if (activeStores.length === 0) {
      setSelectedEditStoreId(null);
      setEditPriceInput('');
      setEditPriceByStoreId({});
      setIsPreparingEditSheet(false);
      return;
    }

    setBusyBarcode(product.barcode);

    try {
      const lookup = await getResultsByBarcodeAcrossActiveStores({ barcode: product.barcode });
      const priceMap: Record<number, number | null> = {};

      for (const storeRow of lookup.stores) {
        priceMap[storeRow.storeId] = storeRow.priceCents;
      }

      setEditPriceByStoreId(priceMap);

      const defaultStoreId =
        selectedEditStoreId != null && activeStores.some((store) => store.id === selectedEditStoreId)
          ? selectedEditStoreId
          : activeStores[0]?.id ?? null;

      setSelectedEditStoreId(defaultStoreId);
      setEditPriceInput(
        defaultStoreId != null ? formatCentsForInput(priceMap[defaultStoreId] ?? null) : ''
      );
    } catch (error) {
      console.error('[products] Failed to load product pricing context', error);
      setEditError('Could not load existing store price details right now.');
      setEditPriceByStoreId({});
      setEditPriceInput('');
      setSelectedEditStoreId(activeStores[0]?.id ?? null);
    } finally {
      setBusyBarcode(null);
      setIsPreparingEditSheet(false);
    }
  }

  function handleSelectEditStore(storeId: number) {
    setSelectedEditStoreId(storeId);
    setEditPriceInput(formatCentsForInput(editPriceByStoreId[storeId] ?? null));
  }

  async function handleSaveEdit() {
    if (!editingBarcode || isSavingEdit) {
      return;
    }

    setEditError(null);
    setScreenError(null);
    setBusyBarcode(editingBarcode);
    setIsSavingEdit(true);

    try {
      const priceCents = parsePriceInputToCents(editPriceInput);

      if (selectedEditStoreId == null) {
        setEditError('Select an active store before saving changes.');
        return;
      }

      if (priceCents == null) {
        setEditError('Enter a valid price (for example 3.99).');
        return;
      }

      await saveStorePrice({
        barcode: editingBarcode,
        productName: editName,
        storeId: selectedEditStoreId,
        priceCents,
      });

      closeSheet();
      await loadProducts(query);
    } catch (error) {
      if (error instanceof PricingValidationError) {
        setEditError(error.message);
        return;
      }

      console.error('[products] Failed to update product and price', error);
      setScreenError('Could not update product right now.');
    } finally {
      setIsSavingEdit(false);
      setBusyBarcode(null);
    }
  }

  async function handleToggleActive(product: ProductListItem) {
    setScreenError(null);
    setBusyBarcode(product.barcode);

    try {
      await setProductActive({ barcode: product.barcode, isActive: !product.isActive });
      await loadProducts(query);
    } catch (error) {
      console.error('[products] Failed to toggle product status', error);
      setScreenError('Could not update product status right now.');
    } finally {
      setBusyBarcode(null);
    }
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.stack}>
          <Surface>
            <Text variant="title">Products</Text>
            <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
              Manage product names and prices per store.
            </Text>

            <View style={styles.formStack}>
              <Input
                label="Search"
                value={query}
                onChangeText={setQuery}
                placeholder="Search by product name or barcode"
                autoCapitalize="none"
                autoCorrect={false}
                testID="products-search-input"
              />
              <Button
                onPress={openAddSheet}
                accessibilityLabel="Add product"
                testID="products-open-add-sheet-button"
              >
                Add Product
              </Button>
            </View>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Saved products</Text>
            <Text variant="caption" tone="secondary" style={styles.sectionLead}>
              Tap a product to edit in the bottom sheet. Use switch to set active/inactive.
            </Text>

            {screenError ? (
              <Text variant="footnote" tone="danger" style={styles.feedbackText}>
                {screenError}
              </Text>
            ) : null}

            {isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator accessibilityRole="progressbar" />
                <Text variant="footnote" tone="secondary">
                  Loading products...
                </Text>
              </View>
            ) : products.length === 0 ? (
              <View style={styles.centerState}>
                <Text variant="body">No products found.</Text>
                <Text variant="footnote" tone="secondary">
                  Tap Add Product to get started.
                </Text>
              </View>
            ) : (
              <View style={styles.listStack}>
                {products.map((product) => {
                  const title = product.name ?? 'Unnamed product';
                  const isBusy = busyBarcode === product.barcode;

                  return (
                    <View key={product.barcode} style={styles.listItemStack}>
                      <ListRow
                        title={title}
                        subtitle={`Barcode: ${product.barcode}`}
                        tone={product.isActive ? 'neutral' : 'secondary'}
                        stateLabel={product.isActive ? 'Active' : 'Inactive'}
                        onPress={() => void startEditing(product)}
                        accessibilityLabel={`${title}, barcode ${product.barcode}, ${
                          product.isActive ? 'active' : 'inactive'
                        }. Tap to edit.`}
                        showChevronWhenPressable={false}
                        rightAccessory={
                          <Pressable
                            accessibilityRole="switch"
                            accessibilityLabel={`Toggle active for ${title}`}
                            accessibilityState={{ checked: product.isActive, disabled: isBusy }}
                            disabled={isBusy}
                            onPress={() => void handleToggleActive(product)}
                            onStartShouldSetResponder={() => true}
                            testID={`product-active-switch-${product.barcode}`}
                            style={({ pressed }) => [
                              styles.activeToggle,
                              {
                                backgroundColor: product.isActive
                                  ? theme.green10?.val ?? theme.green9?.val
                                  : theme.surface?.val ?? theme.background?.val,
                                borderColor: product.isActive
                                  ? theme.green9?.val ?? theme.borderColor?.val
                                  : theme.borderColor?.val,
                                opacity: isBusy ? 0.5 : pressed ? 0.85 : 1,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.activeThumb,
                                product.isActive ? styles.activeThumbOn : styles.activeThumbOff,
                                {
                                  backgroundColor: theme.surface?.val ?? theme.background?.val,
                                  borderColor: theme.borderColor?.val,
                                },
                              ]}
                            >
                              <Text variant="caption" tone={product.isActive ? 'success' : 'secondary'}>
                                {product.isActive ? '✓' : '✕'}
                              </Text>
                            </View>
                          </Pressable>
                        }
                        testID={`product-row-${product.barcode}`}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </Surface>
        </View>
      </ScrollView>

      <Modal
        visible={sheetMode !== null}
        transparent
        animationType="slide"
        onRequestClose={closeSheet}
      >
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetBackdropTouch} onPress={closeSheet} />
          <Surface style={styles.sheetSurface}>
            <View style={styles.sheetHeaderRow}>
              <Text variant="headline">{sheetMode === 'add' ? 'Add Product' : 'Edit Product'}</Text>
              <Button
                variant="secondary"
                onPress={closeSheet}
                testID="products-sheet-close-button"
              >
                Close
              </Button>
            </View>

            {sheetMode === 'add' ? (
              <ScrollView contentContainerStyle={styles.sheetContent}>
                <View style={styles.barcodeRow}>
                  <Text variant="footnote" tone="secondary" style={styles.barcodeLabel}>
                    Barcode
                  </Text>
                  <View style={styles.barcodeInputAndTriggerRow}>
                    <View style={styles.barcodeInputWrap}>
                      <Input
                        value={addBarcode}
                        onChangeText={setAddBarcode}
                        placeholder="UPC/EAN"
                        keyboardType="number-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                        accessibilityLabel="Barcode"
                        testID="products-add-barcode-input"
                      />
                    </View>
                    <View style={styles.scanTriggerRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Scan barcode"
                        onPress={openBarcodeScanner}
                        testID="products-add-barcode-scan-trigger"
                        style={({ pressed }) => [
                          styles.scanIconButton,
                          {
                            backgroundColor: theme.surface?.val ?? theme.background?.val,
                            borderColor: theme.borderColor?.val,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Ionicons
                          name="barcode-outline"
                          size={22}
                          color={theme.textPrimary?.val ?? theme.color?.val}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>

                {isBarcodeScannerOpen ? (
                  <Surface variant="subtle" style={styles.scannerSheet}>
                    <Text variant="headline">Scan barcode</Text>
                    {scannerPermissionState.status === 'loading' ? (
                      <View style={styles.centerState}>
                        <ActivityIndicator accessibilityRole="progressbar" />
                        <Text variant="footnote" tone="secondary">
                          Checking camera access...
                        </Text>
                      </View>
                    ) : null}

                    {scannerPermissionState.status === 'request' ? (
                      <View style={styles.formStack}>
                        <Text variant="footnote" tone="secondary">
                          Camera access is needed to scan barcodes.
                        </Text>
                        <Button
                          onPress={() => void requestScannerPermission()}
                          testID="products-add-barcode-scan-permission"
                        >
                          Enable Camera
                        </Button>
                      </View>
                    ) : null}

                    {scannerPermissionState.status === 'denied' ? (
                      <Text variant="footnote" tone="warning">
                        Camera access is denied. You can still type the barcode manually.
                      </Text>
                    ) : null}

                    {scannerPermissionState.status === 'unavailable' ? (
                      <Text variant="footnote" tone="warning">
                        Camera is unavailable on this device. You can still type the barcode manually.
                      </Text>
                    ) : null}

                    {scannerPermissionState.status === 'error' ? (
                      <View style={styles.formStack}>
                        <Text variant="footnote" tone="danger">
                          Camera status unavailable right now.
                        </Text>
                        <Button
                          variant="secondary"
                          onPress={() => void loadScannerPermissionState()}
                          testID="products-add-barcode-scan-retry"
                        >
                          Retry
                        </Button>
                      </View>
                    ) : null}

                    {scannerPermissionState.status === 'ready' ? (
                      <ScanCamera
                        isActive
                        enableTorch={false}
                        onBarcodeScanned={handleScannerBarcodeScanned}
                      />
                    ) : null}

                    <View style={styles.scannerActions}>
                      <Button
                        variant="secondary"
                        onPress={closeBarcodeScanner}
                        testID="products-add-barcode-scan-cancel"
                      >
                        Close Scanner
                      </Button>
                    </View>
                  </Surface>
                ) : null}

                <Input
                  label="Product name"
                  value={addName}
                  onChangeText={setAddName}
                  placeholder="e.g. Greek Yogurt"
                  autoCapitalize="words"
                  returnKeyType="next"
                  testID="products-add-name-input"
                />
                <Input
                  label="Price"
                  value={addPriceInput}
                  onChangeText={setAddPriceInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  helperText="Enter a local store price in dollars."
                  testID="products-add-price-input"
                />

                {activeStores.length === 0 ? (
                  <Text variant="footnote" tone="warning" testID="products-add-no-store">
                    Add and activate at least one store before saving products.
                  </Text>
                ) : (
                  <View style={styles.selectorGroup}>
                    <Text variant="footnote" tone="secondary">
                      Store
                    </Text>
                    <ScrollView
                      style={styles.selectorScroll}
                      contentContainerStyle={styles.selectorRow}
                      nestedScrollEnabled
                    >
                      {activeStores.map((store) => {
                        const isSelected = selectedAddStoreId === store.id;
                        return (
                          <View key={store.id} style={styles.selectorItemWrap}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityState={{ selected: isSelected }}
                              accessibilityLabel={`Select ${store.name} for add product`}
                              onPress={() => setSelectedAddStoreId(store.id)}
                              testID={`products-add-store-option-${store.id}`}
                              style={({ pressed }) => [
                                styles.selectorChip,
                                {
                                  backgroundColor: isSelected
                                    ? theme.accentBackground?.val
                                    : theme.surface?.val ?? theme.background?.val,
                                  borderColor: isSelected
                                    ? theme.accentBorderColor?.val
                                    : theme.borderColor?.val,
                                  opacity: pressed ? 0.85 : 1,
                                },
                              ]}
                            >
                              <Text
                                variant="caption"
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                style={{
                                  color: isSelected
                                    ? theme.accentColor?.val ?? '#ffffff'
                                    : theme.textPrimary?.val ?? theme.color?.val,
                                }}
                              >
                                {store.name}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {addError ? (
                  <Text variant="footnote" tone="danger" testID="products-add-error">
                    {addError}
                  </Text>
                ) : null}

                <View style={styles.sheetActions}>
                  <Button
                    variant="secondary"
                    onPress={closeSheet}
                    testID="products-add-cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isAddingProduct}
                    onPress={() => void handleAddProduct()}
                    testID="products-add-save-button"
                  >
                    Save Product
                  </Button>
                </View>
              </ScrollView>
            ) : null}

            {sheetMode === 'edit' ? (
              <ScrollView contentContainerStyle={styles.sheetContent}>
                {isPreparingEditSheet ? (
                  <View style={styles.centerState}>
                    <ActivityIndicator accessibilityRole="progressbar" />
                    <Text variant="footnote" tone="secondary">
                      Loading existing product details...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Input
                      label="Product name"
                      value={editName}
                      onChangeText={setEditName}
                      autoCapitalize="words"
                      testID="products-edit-name-input"
                    />
                    <Input
                      label="Price"
                      value={editPriceInput}
                      onChangeText={setEditPriceInput}
                      keyboardType="decimal-pad"
                      autoCapitalize="none"
                      placeholder="0.00"
                      helperText="Enter a local store price in dollars."
                      testID="products-edit-price-input"
                    />

                    {activeStores.length === 0 ? (
                      <Text variant="footnote" tone="warning" testID="products-edit-no-store">
                        Add and activate a store before saving price changes.
                      </Text>
                    ) : (
                      <View style={styles.selectorGroup}>
                        <Text variant="footnote" tone="secondary">
                          Store
                        </Text>
                        <ScrollView
                          style={styles.selectorScroll}
                          contentContainerStyle={styles.selectorRow}
                          nestedScrollEnabled
                        >
                          {activeStores.map((store) => {
                            const isSelected = selectedEditStoreId === store.id;
                            return (
                              <View key={store.id} style={styles.selectorItemWrap}>
                                <Pressable
                                  accessibilityRole="button"
                                  accessibilityState={{ selected: isSelected }}
                                  accessibilityLabel={`Select ${store.name} for edit product`}
                                  onPress={() => handleSelectEditStore(store.id)}
                                  testID={`products-edit-store-option-${store.id}`}
                                  style={({ pressed }) => [
                                    styles.selectorChip,
                                    {
                                      backgroundColor: isSelected
                                        ? theme.accentBackground?.val
                                        : theme.surface?.val ?? theme.background?.val,
                                      borderColor: isSelected
                                        ? theme.accentBorderColor?.val
                                        : theme.borderColor?.val,
                                      opacity: pressed ? 0.85 : 1,
                                    },
                                  ]}
                                >
                                  <Text
                                    variant="caption"
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={{
                                      color: isSelected
                                        ? theme.accentColor?.val ?? '#ffffff'
                                        : theme.textPrimary?.val ?? theme.color?.val,
                                    }}
                                  >
                                    {store.name}
                                  </Text>
                                </Pressable>
                              </View>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}

                    {editError ? (
                      <Text variant="footnote" tone="danger" testID="products-edit-error">
                        {editError}
                      </Text>
                    ) : null}

                    <View style={styles.sheetActions}>
                      <Button
                        variant="secondary"
                        disabled={isSavingEdit}
                        onPress={closeSheet}
                        testID="products-edit-cancel-button"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={isSavingEdit}
                        onPress={() => void handleSaveEdit()}
                        testID="products-edit-save-button"
                      >
                        Save Changes
                      </Button>
                    </View>
                  </>
                )}
              </ScrollView>
            ) : null}
          </Surface>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.xs,
  },
  formStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  listItemStack: {
    gap: spacing.xs,
  },
  activeToggle: {
    minHeight: 32,
    width: 56,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  activeThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeThumbOn: {
    alignSelf: 'flex-end',
  },
  activeThumbOff: {
    alignSelf: 'flex-start',
  },
  selectorGroup: {
    gap: spacing.xs,
  },
  selectorScroll: {
    maxHeight: 176,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  selectorItemWrap: {
    width: '31%',
  },
  selectorChip: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 28,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeRow: {
    gap: spacing.xs,
  },
  barcodeLabel: {
    marginBottom: spacing.xxs,
  },
  barcodeInputWrap: {
    flex: 1,
  },
  barcodeInputAndTriggerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  scanTriggerRow: {
    alignItems: 'center',
  },
  scanIconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerSheet: {
    gap: spacing.sm,
  },
  scannerActions: {
    alignItems: 'flex-end',
  },
  feedbackText: {
    marginTop: spacing.sm,
  },
  centerState: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheetBackdropTouch: {
    flex: 1,
  },
  sheetSurface: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '88%',
    paddingBottom: spacing.md,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  sheetContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  sheetActions: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
});
