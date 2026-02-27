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
import { radii, spacing, touchTargets } from '../../theme/tokens';

type ShoppingListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; items: ShoppingListItemRecord[] };

export function ShoppingListFeatureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [screenState, setScreenState] = useState<ShoppingListState>({ status: 'loading' });
  const isActiveRef = useRef(false);
  const latestLoadIdRef = useRef(0);

  const loadItems = useCallback(async () => {
    const requestId = latestLoadIdRef.current + 1;
    latestLoadIdRef.current = requestId;
    setScreenState({ status: 'loading' });

    try {
      const items = await listShoppingListItems();
      if (!isActiveRef.current || requestId !== latestLoadIdRef.current) {
        return;
      }
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

  const handleQuantityChange = useCallback(
    async (item: ShoppingListItemRecord, delta: number) => {
      const nextQuantity = item.quantity + delta;
      if (nextQuantity < 1) {
        return;
      }

      updateItemState(item.barcode, (current) => ({
        ...current,
        quantity: nextQuantity,
      }));

      try {
        await setShoppingListItemQuantity({ barcode: item.barcode, quantity: nextQuantity });
      } catch (error) {
        console.error('[shopping-list] Failed to update quantity', error);
        void loadItems();
      }
    },
    [loadItems, updateItemState]
  );

  const handleToggleChecked = useCallback(
    async (item: ShoppingListItemRecord) => {
      const nextChecked = !item.isChecked;

      updateItemState(item.barcode, (current) => ({
        ...current,
        isChecked: nextChecked,
      }));

      try {
        await toggleShoppingListItemChecked({ barcode: item.barcode, isChecked: nextChecked });
      } catch (error) {
        console.error('[shopping-list] Failed to toggle checked state', error);
        void loadItems();
      }
    },
    [loadItems, updateItemState]
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
                              onPress={() => void handleQuantityChange(item, 1)}
                              testID={`shopping-list-increase-${item.barcode}`}
                              style={({ pressed }) => [
                                styles.controlButton,
                                {
                                  backgroundColor:
                                    theme.surface?.val ?? theme.background?.val,
                                  borderColor: theme.borderColor?.val,
                                  opacity: pressed ? 0.85 : 1,
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
