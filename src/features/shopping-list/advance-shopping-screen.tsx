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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import {
  getShoppingListById,
  listShoppingListCartItems,
  listStoreProductsForShopping,
  removeShoppingListCartItem,
  setShoppingListStatus,
  updateShoppingListCartItemQuantity,
  upsertShoppingListCartItem,
  type ShoppingCartItemRecord,
  type ShoppingListDetailRecord,
  type ShoppingStoreProductRecord,
} from '../../db/repositories/shopping-list-repository';
import { SHOPPING_LIST_QUANTITY_MAX } from '../../db/validation/shopping-list';
import { radii, spacing } from '../../theme/tokens';

type ScreenState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; list: ShoppingListDetailRecord };

const MAX_VISIBLE_ROWS = 6;
const COMPACT_ROW_HEIGHT = 40;
const LIST_VIEWPORT_MAX_HEIGHT =
  MAX_VISIBLE_ROWS * COMPACT_ROW_HEIGHT + (MAX_VISIBLE_ROWS - 1) * 3;

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function parseQuantity(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  if (parsed < 1 || parsed > SHOPPING_LIST_QUANTITY_MAX) {
    return null;
  }
  return parsed;
}

export function AdvanceShoppingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ listId?: string }>();

  const listId = useMemo(() => {
    const parsed = Number.parseInt(params.listId ?? '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [params.listId]);

  const [screenState, setScreenState] = useState<ScreenState>({ status: 'loading' });
  const [products, setProducts] = useState<ShoppingStoreProductRecord[]>([]);
  const [cartItems, setCartItems] = useState<ShoppingCartItemRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [writeError, setWriteError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<ShoppingStoreProductRecord | null>(null);
  const [addQuantityInput, setAddQuantityInput] = useState('1');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedCartItem, setSelectedCartItem] = useState<ShoppingCartItemRecord | null>(null);
  const [editQuantityInput, setEditQuantityInput] = useState('1');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isEditable = screenState.status === 'ready' && screenState.list.status === 'active';

  const loadList = useCallback(async () => {
    if (!listId) {
      setScreenState({ status: 'error', message: 'Shopping list not found.' });
      return;
    }

    setScreenState({ status: 'loading' });

    try {
      const list = await getShoppingListById({ shoppingListId: listId });
      if (!list) {
        setScreenState({ status: 'error', message: 'Shopping list not found.' });
        return;
      }

      const items = await listShoppingListCartItems({ shoppingListId: list.id });
      setCartItems(items);
      setScreenState({ status: 'ready', list });
    } catch (error) {
      console.error('[shopping] Failed to load advance shopping screen', error);
      setScreenState({ status: 'error', message: 'Could not load this shopping list right now.' });
    }
  }, [listId]);

  const loadProducts = useCallback(async () => {
    if (screenState.status !== 'ready') {
      return;
    }

    try {
      const found = await listStoreProductsForShopping({
        shoppingListId: screenState.list.id,
        query: searchQuery,
      });
      setProducts(found);
    } catch (error) {
      console.error('[shopping] Failed to load shopping products', error);
    }
  }, [screenState, searchQuery]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const cartByBarcode = useMemo(() => {
    const map = new Map<string, ShoppingCartItemRecord>();
    for (const item of cartItems) {
      map.set(item.barcode, item);
    }
    return map;
  }, [cartItems]);

  const totalAmountCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.amountCents, 0),
    [cartItems]
  );

  const refreshCart = useCallback(async () => {
    if (!listId) {
      return;
    }

    const items = await listShoppingListCartItems({ shoppingListId: listId });
    setCartItems(items);
  }, [listId]);

  const openAddModal = useCallback(
    (product: ShoppingStoreProductRecord) => {
      if (!isEditable) {
        return;
      }

      const existing = cartByBarcode.get(product.barcode);
      setSelectedProduct(product);
      setAddQuantityInput(`${existing?.quantity ?? 1}`);
      setIsAddModalOpen(true);
      setWriteError(null);
    },
    [cartByBarcode, isEditable]
  );

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
    setSelectedProduct(null);
    setAddQuantityInput('1');
  }, []);

  const openEditModal = useCallback(
    (item: ShoppingCartItemRecord) => {
      if (!isEditable) {
        return;
      }

      setSelectedCartItem(item);
      setEditQuantityInput(`${item.quantity}`);
      setIsEditModalOpen(true);
      setWriteError(null);
    },
    [isEditable]
  );

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setSelectedCartItem(null);
    setEditQuantityInput('1');
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (!selectedProduct || !listId) {
      return;
    }

    const quantity = parseQuantity(addQuantityInput);
    if (!quantity) {
      setWriteError('Enter a valid quantity between 1 and 999.');
      return;
    }

    try {
      await upsertShoppingListCartItem({
        shoppingListId: listId,
        barcode: selectedProduct.barcode,
        productName: selectedProduct.productName,
        priceCents: selectedProduct.priceCents,
        quantity,
      });
      await refreshCart();
      closeAddModal();
    } catch (error) {
      console.error('[shopping] Failed to add item to cart', error);
      setWriteError('Could not add this item right now.');
    }
  }, [addQuantityInput, closeAddModal, listId, refreshCart, selectedProduct]);

  const handleSaveCartQuantity = useCallback(async () => {
    if (!selectedCartItem || !listId) {
      return;
    }

    const quantity = parseQuantity(editQuantityInput);
    if (!quantity) {
      setWriteError('Enter a valid quantity between 1 and 999.');
      return;
    }

    try {
      await updateShoppingListCartItemQuantity({
        shoppingListId: listId,
        barcode: selectedCartItem.barcode,
        productName: selectedCartItem.productName,
        priceCents: selectedCartItem.priceCents,
        quantity,
      });
      await refreshCart();
      closeEditModal();
    } catch (error) {
      console.error('[shopping] Failed to update item quantity', error);
      setWriteError('Could not update this item right now.');
    }
  }, [closeEditModal, editQuantityInput, listId, refreshCart, selectedCartItem]);

  const handleDeleteFromCart = useCallback(async () => {
    if (!selectedCartItem || !listId) {
      return;
    }

    try {
      await removeShoppingListCartItem({
        shoppingListId: listId,
        barcode: selectedCartItem.barcode,
      });
      await refreshCart();
      closeEditModal();
    } catch (error) {
      console.error('[shopping] Failed to delete cart item', error);
      setWriteError('Could not remove this item right now.');
    }
  }, [closeEditModal, listId, refreshCart, selectedCartItem]);

  const handleMarkDone = useCallback(async () => {
    if (screenState.status !== 'ready') {
      return;
    }

    try {
      const updated = await setShoppingListStatus({
        shoppingListId: screenState.list.id,
        status: 'done',
      });
      setScreenState({ status: 'ready', list: updated });
      setWriteError(null);
    } catch (error) {
      console.error('[shopping] Failed to mark list done', error);
      setWriteError('Could not mark this list as done right now.');
    }
  }, [screenState]);

  if (screenState.status === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }}>
        <View style={styles.centerState}>
          <ActivityIndicator accessibilityRole="progressbar" />
          <Text variant="footnote" tone="secondary">
            Loading advanced shopping...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState.status === 'error') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background?.val }}>
        <View style={styles.centerState}>
          <Text variant="body" tone="danger">
            {screenState.message}
          </Text>
          <Button variant="secondary" onPress={() => void loadList()}>
            Retry
          </Button>
          <Button onPress={() => router.back()}>Back to Shopping</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.stack}>
          <Surface>
            <Text variant="title">Advance Shopping</Text>
            <Text variant="footnote" tone="secondary" style={styles.sectionLead} numberOfLines={1}>
              Store: {screenState.list.storeName ?? 'Unknown store'}
            </Text>
            <Text variant="caption" tone="secondary" numberOfLines={1}>
              Status: {screenState.list.status}
            </Text>
            {!isEditable ? (
              <Text variant="caption" tone="secondary" style={styles.sectionLead}>
                This list is done. Viewing only.
              </Text>
            ) : null}
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Find products</Text>
            <Input
              accessibilityLabel="Search product by name"
              placeholder="Search product by name"
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="advance-shopping-search"
            />

            <View style={styles.listViewport}>
              <ScrollView
                nestedScrollEnabled
                contentContainerStyle={styles.compactStack}
                showsVerticalScrollIndicator={products.length > MAX_VISIBLE_ROWS}
              >
                {products.map((product) => {
                  const inCart = cartByBarcode.has(product.barcode);
                  return (
                    <Pressable
                      key={product.barcode}
                      accessibilityRole={isEditable ? 'button' : undefined}
                      accessibilityLabel={`${product.productName}, ${formatCurrency(product.priceCents)}`}
                      onPress={() => openAddModal(product)}
                      disabled={!isEditable}
                      style={({ pressed }) => [
                        styles.compactRow,
                        {
                          borderColor: theme.borderColor?.val,
                          backgroundColor: theme.surface?.val ?? theme.background?.val,
                          opacity: !isEditable ? 0.75 : pressed ? 0.9 : 1,
                        },
                      ]}
                      testID={`advance-shopping-product-${product.barcode}`}
                    >
                      <Text variant="footnote" style={styles.productNameText} numberOfLines={1}>
                        {product.productName}
                      </Text>
                      <Text variant="footnote" tone="secondary" style={styles.priceText} numberOfLines={1}>
                        {formatCurrency(product.priceCents)}
                      </Text>
                      <Text variant="footnote" tone={inCart ? 'primary' : 'secondary'} style={styles.checkText}>
                        {inCart ? '✓' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Total amount</Text>
            <Text variant="title">{formatCurrency(totalAmountCents)}</Text>

            <Text variant="headline" style={styles.sectionLead}>
              Cart
            </Text>

            {cartItems.length === 0 ? (
              <Text variant="footnote" tone="secondary">
                No products in cart yet.
              </Text>
            ) : (
              <View style={styles.listViewport}>
                <ScrollView
                  nestedScrollEnabled
                  contentContainerStyle={styles.compactStack}
                  showsVerticalScrollIndicator={cartItems.length > MAX_VISIBLE_ROWS}
                >
                  {cartItems.map((item) => (
                    <Pressable
                      key={item.barcode}
                      accessibilityRole={isEditable ? 'button' : undefined}
                      accessibilityLabel={`Edit cart item ${item.productName}`}
                      onPress={() => openEditModal(item)}
                      disabled={!isEditable}
                      style={({ pressed }) => [
                        styles.compactRow,
                        {
                          borderColor: theme.borderColor?.val,
                          backgroundColor: theme.surface?.val ?? theme.background?.val,
                          opacity: !isEditable ? 0.75 : pressed ? 0.9 : 1,
                        },
                      ]}
                      testID={`advance-shopping-cart-${item.barcode}`}
                    >
                      <Text variant="footnote" style={styles.productNameText} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text variant="footnote" tone="secondary" style={styles.priceText} numberOfLines={1}>
                        {formatCurrency(item.priceCents)} x{item.quantity}
                      </Text>
                      <Text variant="footnote" style={styles.amountText} numberOfLines={1}>
                        {formatCurrency(item.amountCents)}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {writeError ? (
              <Text variant="caption" tone="danger" style={styles.sectionLead}>
                {writeError}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              {isEditable ? (
                <Button
                  variant="secondary"
                  accessibilityLabel="Mark shopping list as done"
                  onPress={() => void handleMarkDone()}
                  testID="advance-shopping-mark-done"
                >
                  Mark as complete
                </Button>
              ) : null}

              <Button
                accessibilityLabel="Save changes and return to shopping"
                onPress={() => router.back()}
                testID="advance-shopping-save"
              >
                Save changes
              </Button>
            </View>
          </Surface>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={isAddModalOpen} onRequestClose={closeAddModal}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdropTouch} onPress={closeAddModal} />
          <View style={styles.sheetDock}>
            <Surface variant="subtle" style={styles.sheetCard}>
              <Text variant="headline">Add to cart</Text>
              <Text variant="footnote" tone="secondary" numberOfLines={1}>
                {selectedProduct?.productName}
              </Text>
              <Input
                accessibilityLabel="Product quantity"
                keyboardType="number-pad"
                value={addQuantityInput}
                onChangeText={setAddQuantityInput}
                testID="advance-shopping-add-qty"
              />
              <View style={styles.sheetActions}>
                <Button variant="secondary" onPress={closeAddModal}>
                  Cancel
                </Button>
                <Button onPress={() => void handleAddToCart()} testID="advance-shopping-add-confirm">
                  Confirm
                </Button>
              </View>
            </Surface>
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={isEditModalOpen} onRequestClose={closeEditModal}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdropTouch} onPress={closeEditModal} />
          <View style={styles.sheetDock}>
            <Surface variant="subtle" style={styles.sheetCard}>
              <Text variant="headline">Edit cart item</Text>
              <Text variant="footnote" tone="secondary" numberOfLines={1}>
                {selectedCartItem?.productName}
              </Text>
              <Input
                accessibilityLabel="Edit quantity"
                keyboardType="number-pad"
                value={editQuantityInput}
                onChangeText={setEditQuantityInput}
                testID="advance-shopping-edit-qty"
              />
              <View style={styles.sheetActions}>
                <Button variant="secondary" onPress={closeEditModal}>
                  Cancel
                </Button>
                <Button variant="secondary" onPress={() => void handleDeleteFromCart()}>
                  Delete
                </Button>
                <Button onPress={() => void handleSaveCartQuantity()}>Update</Button>
              </View>
            </Surface>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  stack: {
    gap: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.sm,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  compactStack: {
    gap: 3,
    marginTop: spacing.sm,
    paddingBottom: 3,
  },
  listViewport: {
    maxHeight: LIST_VIEWPORT_MAX_HEIGHT,
  },
  compactRow: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  productNameText: {
    flex: 1.5,
  },
  priceText: {
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    flex: 1,
    textAlign: 'right',
  },
  checkText: {
    width: 20,
    textAlign: 'right',
  },
  actionsRow: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheetBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetDock: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  sheetCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
});
