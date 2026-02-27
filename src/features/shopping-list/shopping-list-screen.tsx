import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { ListRow } from '../../components/ui/list-row';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import {
  listShoppingListItems,
  setShoppingListItemQuantity,
  type ShoppingListItemRecord,
  toggleShoppingListItemChecked,
} from '../../db/repositories/shopping-list-repository';
import { SHOPPING_LIST_QUANTITY_MAX } from '../../db/validation/shopping-list';
import { radii, spacing, touchTargets } from '../../theme/tokens';

type ShoppingListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: ShoppingListItemRecord[] };

export function ShoppingListFeatureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [screenState, setScreenState] = useState<ShoppingListState>({ status: 'loading' });
  const [writeErrorMessage, setWriteErrorMessage] = useState<string | null>(null);
  const isActiveRef = useRef(false);
  const latestLoadIdRef = useRef(0);
  const quantityTargetsRef = useRef(new Map<string, number>());
  const quantitySyncingRef = useRef(new Set<string>());
  const checkedTargetsRef = useRef(new Map<string, boolean>());
  const checkedSyncingRef = useRef(new Set<string>());
  const optimisticQuantityRef = useRef(new Map<string, number>());
  const optimisticCheckedRef = useRef(new Map<string, boolean>());

  const loadItems = useCallback(async () => {
    const requestId = latestLoadIdRef.current + 1;
    latestLoadIdRef.current = requestId;
    setScreenState({ status: 'loading' });

    try {
      const items = await listShoppingListItems();
      if (!isActiveRef.current || requestId !== latestLoadIdRef.current) {
        return;
      }
      const quantityByBarcode = new Map<string, number>();
      const checkedByBarcode = new Map<string, boolean>();
      for (const item of items) {
        quantityByBarcode.set(item.barcode, item.quantity);
        checkedByBarcode.set(item.barcode, item.isChecked);
      }
      optimisticQuantityRef.current = quantityByBarcode;
      optimisticCheckedRef.current = checkedByBarcode;
      setScreenState({ status: 'ready', items });
    } catch (error) {
      if (!isActiveRef.current || requestId !== latestLoadIdRef.current) {
        return;
      }
      console.error('[shopping-list] Failed to load list items', error);
      setScreenState({
        status: 'error',
        message: 'Could not load your Shopping List right now.',
      });
    }
  }, []);

  const updateItemState = useCallback(
    (barcode: string, updater: (item: ShoppingListItemRecord) => ShoppingListItemRecord) => {
      setScreenState((prev) => {
        if (prev.status !== 'ready') {
          return prev;
        }
        const updatedItems = prev.items.map((item) =>
          item.barcode === barcode ? updater(item) : item
        );
        return { status: 'ready', items: updatedItems };
      });
    },
    []
  );

  const flushQuantityUpdates = useCallback(
    async (barcode: string) => {
      if (quantitySyncingRef.current.has(barcode)) {
        return;
      }

      quantitySyncingRef.current.add(barcode);

      try {
        while (true) {
          const target = quantityTargetsRef.current.get(barcode);
          if (target == null) {
            break;
          }

          quantityTargetsRef.current.delete(barcode);
          await setShoppingListItemQuantity({ barcode, quantity: target });
        }
      } catch (error) {
        quantityTargetsRef.current.delete(barcode);
        console.error('[shopping-list] Failed to update quantity', error);
        setWriteErrorMessage('Could not save quantity change. Restored the last saved values.');
        void loadItems();
      } finally {
        quantitySyncingRef.current.delete(barcode);
        if (quantityTargetsRef.current.has(barcode)) {
          void flushQuantityUpdates(barcode);
        }
      }
    },
    [loadItems]
  );

  const flushCheckedUpdates = useCallback(
    async (barcode: string) => {
      if (checkedSyncingRef.current.has(barcode)) {
        return;
      }

      checkedSyncingRef.current.add(barcode);

      try {
        while (true) {
          const target = checkedTargetsRef.current.get(barcode);
          if (target == null) {
            break;
          }

          checkedTargetsRef.current.delete(barcode);
          await toggleShoppingListItemChecked({ barcode, isChecked: target });
        }
      } catch (error) {
        checkedTargetsRef.current.delete(barcode);
        console.error('[shopping-list] Failed to toggle checked state', error);
        setWriteErrorMessage('Could not update checked state. Restored the last saved values.');
        void loadItems();
      } finally {
        checkedSyncingRef.current.delete(barcode);
        if (checkedTargetsRef.current.has(barcode)) {
          void flushCheckedUpdates(barcode);
        }
      }
    },
    [loadItems]
  );

  const handleQuantityChange = useCallback(
    (item: ShoppingListItemRecord, delta: number) => {
      const currentQuantity =
        optimisticQuantityRef.current.get(item.barcode) ?? item.quantity;
      const nextQuantity = Math.max(
        1,
        Math.min(SHOPPING_LIST_QUANTITY_MAX, currentQuantity + delta)
      );
      if (nextQuantity === currentQuantity) {
        return;
      }

      setWriteErrorMessage(null);
      optimisticQuantityRef.current.set(item.barcode, nextQuantity);
      updateItemState(item.barcode, (current) => ({
        ...current,
        quantity: nextQuantity,
      }));
      quantityTargetsRef.current.set(item.barcode, nextQuantity);
      void flushQuantityUpdates(item.barcode);
    },
    [flushQuantityUpdates, updateItemState]
  );

  const handleToggleChecked = useCallback(
    (item: ShoppingListItemRecord) => {
      const currentChecked =
        optimisticCheckedRef.current.get(item.barcode) ?? item.isChecked;
      const nextChecked = !currentChecked;

      setWriteErrorMessage(null);
      optimisticCheckedRef.current.set(item.barcode, nextChecked);
      updateItemState(item.barcode, (current) => ({
        ...current,
        isChecked: nextChecked,
      }));
      checkedTargetsRef.current.set(item.barcode, nextChecked);
      void flushCheckedUpdates(item.barcode);
    },
    [flushCheckedUpdates, updateItemState]
  );

  useFocusEffect(
    useCallback(() => {
      isActiveRef.current = true;
      void loadItems();

      return () => {
        isActiveRef.current = false;
      };
    }, [loadItems])
  );

  const hasItems = screenState.status === 'ready' && screenState.items.length > 0;

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
            <Text variant="title">Shopping List</Text>
            <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
              Track what you plan to buy while you shop.
            </Text>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Your items</Text>
            <Text variant="caption" tone="secondary" style={styles.sectionLead}>
              Quantities update as you add more items from Results.
            </Text>
            {writeErrorMessage ? (
              <Text
                variant="caption"
                tone="danger"
                style={styles.sectionLead}
                testID="shopping-list-write-error"
              >
                {writeErrorMessage}
              </Text>
            ) : null}

            {screenState.status === 'loading' ? (
              <View style={styles.centerState}>
                <ActivityIndicator accessibilityRole="progressbar" />
                <Text variant="footnote" tone="secondary">
                  Loading list...
                </Text>
              </View>
            ) : null}

            {screenState.status === 'error' ? (
              <View style={styles.centerState}>
                <Text variant="body" tone="danger">
                  {screenState.message}
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Retry loading shopping list"
                  onPress={() => void loadItems()}
                  testID="shopping-list-retry-button"
                >
                  Retry
                </Button>
              </View>
            ) : null}

            {screenState.status === 'ready' && !hasItems ? (
              <View style={styles.centerState} testID="shopping-list-empty">
                <Text variant="body">No items in your list yet.</Text>
                <Text variant="footnote" tone="secondary">
                  Scan an item and add it from Results to get started.
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Go to Scan"
                  onPress={() => router.push('/scan')}
                  testID="shopping-list-scan-button"
                >
                  Go to Scan
                </Button>
              </View>
            ) : null}

            {screenState.status === 'ready' && hasItems ? (
              <View style={styles.listStack}>
                {screenState.items.map((item) => {
                  const title = item.productName ?? 'Unknown product';
                  const subtitle = `Barcode: ${item.barcode}`;
                  const meta = item.isChecked ? 'In cart' : 'Not in cart';
                  const decreaseDisabled = item.quantity <= 1;
                  const increaseDisabled = item.quantity >= SHOPPING_LIST_QUANTITY_MAX;

                  return (
                    <ListRow
                      key={item.barcode}
                      title={title}
                      subtitle={subtitle}
                      meta={meta}
                      stateLabel={`Qty ${item.quantity}`}
                      tone={item.isChecked ? 'secondary' : 'neutral'}
                      rightAccessory={
                        <View style={styles.controls}>
                          <View style={styles.quantityControls}>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Decrease quantity for ${title}`}
                              disabled={decreaseDisabled}
                              onPress={() => void handleQuantityChange(item, -1)}
                              testID={`shopping-list-decrease-${item.barcode}`}
                              style={({ pressed }) => [
                                styles.controlButton,
                                {
                                  backgroundColor:
                                    theme.surface?.val ?? theme.background?.val,
                                  borderColor: theme.borderColor?.val,
                                  opacity: decreaseDisabled ? 0.5 : pressed ? 0.85 : 1,
                                },
                              ]}
                            >
                              <Text variant="headline">-</Text>
                            </Pressable>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`Increase quantity for ${title}`}
                              disabled={increaseDisabled}
                              onPress={() => void handleQuantityChange(item, 1)}
                              testID={`shopping-list-increase-${item.barcode}`}
                              style={({ pressed }) => [
                                styles.controlButton,
                                {
                                  backgroundColor:
                                    theme.surface?.val ?? theme.background?.val,
                                  borderColor: theme.borderColor?.val,
                                  opacity: increaseDisabled ? 0.5 : pressed ? 0.85 : 1,
                                },
                              ]}
                            >
                              <Text variant="headline">+</Text>
                            </Pressable>
                          </View>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Toggle in cart for ${title}`}
                            onPress={() => void handleToggleChecked(item)}
                            testID={`shopping-list-toggle-${item.barcode}`}
                            style={({ pressed }) => [
                              styles.toggleButton,
                              {
                                backgroundColor:
                                  theme.surface?.val ?? theme.background?.val,
                                borderColor: theme.borderColor?.val,
                                opacity: pressed ? 0.85 : 1,
                              },
                            ]}
                          >
                            <Text variant="caption">
                              {item.isChecked ? 'Uncheck' : 'Check'}
                            </Text>
                          </Pressable>
                        </View>
                      }
                      testID={`shopping-list-row-${item.barcode}`}
                    />
                  );
                })}
              </View>
            ) : null}
          </Surface>
        </View>
      </ScrollView>
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
  centerState: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  listStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  controls: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  quantityControls: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  controlButton: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    minHeight: touchTargets.min,
    minWidth: touchTargets.min,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
