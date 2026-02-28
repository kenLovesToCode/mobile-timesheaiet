import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import { listStores } from '../../db/repositories/store-repository';
import {
  createShoppingList,
  listShoppingLists,
  type ShoppingListSummaryRecord,
} from '../../db/repositories/shopping-list-repository';
import { radii, spacing, touchTargets } from '../../theme/tokens';

type ScreenState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; lists: ShoppingListSummaryRecord[] };

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatCreatedDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export function ShoppingListFeatureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [screenState, setScreenState] = useState<ScreenState>({ status: 'loading' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [stores, setStores] = useState<{ id: number; name: string }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [isSavingList, setIsSavingList] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setScreenState({ status: 'loading' });

    try {
      const [lists, allStores] = await Promise.all([listShoppingLists(), listStores()]);
      const activeStores = allStores.filter((store) => store.isActive);
      setStores(activeStores.map((store) => ({ id: store.id, name: store.name })));
      setSelectedStoreId(activeStores[0]?.id ?? null);
      setScreenState({ status: 'ready', lists });
    } catch (error) {
      console.error('[shopping] Failed to load shopping list index', error);
      setScreenState({
        status: 'error',
        message: 'Could not load your shopping lists right now.',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const hasLists = screenState.status === 'ready' && screenState.lists.length > 0;

  const canCreateList = useMemo(
    () => !isSavingList && selectedStoreId != null && stores.length > 0,
    [isSavingList, selectedStoreId, stores.length]
  );

  const openCreateModal = useCallback(() => {
    setCreateError(null);
    if (stores.length > 0 && selectedStoreId == null) {
      setSelectedStoreId(stores[0].id);
    }
    setIsCreateModalOpen(true);
  }, [selectedStoreId, stores]);

  const closeCreateModal = useCallback(() => {
    if (isSavingList) {
      return;
    }
    setIsCreateModalOpen(false);
    setCreateError(null);
  }, [isSavingList]);

  const handleCreateList = useCallback(async () => {
    if (!selectedStoreId) {
      setCreateError('Store is required.');
      return;
    }

    setCreateError(null);
    setIsSavingList(true);

    try {
      const created = await createShoppingList({ storeId: selectedStoreId });
      setIsCreateModalOpen(false);
      router.push(`/shopping/${created.id}`);
    } catch (error) {
      console.error('[shopping] Failed to create shopping list', error);
      setCreateError('Could not create a new list right now.');
    } finally {
      setIsSavingList(false);
    }
  }, [router, selectedStoreId]);

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
              Create list per store and keep rows compact for in-store use.
            </Text>
            <Button
              accessibilityLabel="Create new shopping list"
              onPress={openCreateModal}
              testID="shopping-list-create-new"
            >
              Create new list
            </Button>
          </Surface>

          <Surface variant="subtle">
            <Text variant="headline">Lists</Text>
            <View
              style={[
                styles.tableHeader,
                {
                  borderColor: theme.borderColor?.val,
                },
              ]}
            >
              <Text variant="caption" tone="secondary" style={styles.colStore} numberOfLines={1}>
                Store
              </Text>
              <Text variant="caption" tone="secondary" style={styles.colDate} numberOfLines={1}>
                Date
              </Text>
              <Text variant="caption" tone="secondary" style={styles.colAmount} numberOfLines={1}>
                Total
              </Text>
              <Text variant="caption" tone="secondary" style={styles.colStatus} numberOfLines={1}>
                Status
              </Text>
            </View>

            {screenState.status === 'loading' ? (
              <View style={styles.centerState}>
                <ActivityIndicator accessibilityRole="progressbar" />
                <Text variant="footnote" tone="secondary">
                  Loading shopping lists...
                </Text>
              </View>
            ) : null}

            {screenState.status === 'error' ? (
              <View style={styles.centerState}>
                <Text variant="body" tone="danger">
                  {screenState.message}
                </Text>
                <Button variant="secondary" onPress={() => void loadData()}>
                  Retry
                </Button>
              </View>
            ) : null}

            {screenState.status === 'ready' ? (
              hasLists ? (
                <View style={styles.rowStack}>
                  {screenState.lists.map((list) => (
                    <Pressable
                      key={list.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Open shopping list for ${list.storeName ?? 'Unknown store'}`}
                      onPress={() => router.push(`/shopping/${list.id}`)}
                      style={({ pressed }) => [
                        styles.row,
                        {
                          borderColor: theme.borderColor?.val,
                          backgroundColor: theme.surface?.val ?? theme.background?.val,
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                      testID={`shopping-list-row-${list.id}`}
                    >
                      <Text variant="footnote" style={styles.colStore} numberOfLines={1}>
                        {list.storeName ?? 'Unknown'}
                      </Text>
                      <Text variant="footnote" style={styles.colDate} numberOfLines={1}>
                        {formatCreatedDate(list.createdAt)}
                      </Text>
                      <Text variant="footnote" style={styles.colAmount} numberOfLines={1}>
                        {formatCurrency(list.totalAmountCents)}
                      </Text>
                      <Text
                        variant="footnote"
                        tone={list.status === 'done' ? 'secondary' : 'primary'}
                        style={styles.colStatus}
                        numberOfLines={1}
                      >
                        {list.status}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.centerState}>
                  <Text variant="body">No shopping lists yet.</Text>
                  <Text variant="footnote" tone="secondary">
                    Tap Create new list to start shopping by store.
                  </Text>
                </View>
              )
            ) : null}
          </Surface>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={isCreateModalOpen}
        onRequestClose={closeCreateModal}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdropTouch} onPress={closeCreateModal} />
          <View style={styles.sheetDock}>
            <Surface variant="subtle" style={styles.sheetCard}>
              <View style={styles.sheetHeaderRow}>
                <Text variant="headline">Create new list</Text>
                <Button variant="secondary" onPress={closeCreateModal}>
                  Close
                </Button>
              </View>
              <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
                Select store (required)
              </Text>

              {stores.length === 0 ? (
                <View style={styles.centerState}>
                  <Text variant="footnote" tone="danger">
                    No active stores found. Activate at least one store first.
                  </Text>
                  <Button variant="secondary" onPress={() => router.push('/stores')}>
                    Go to Stores
                  </Button>
                </View>
              ) : (
                <View style={styles.storeOptions}>
                  {stores.map((store) => {
                    const isSelected = selectedStoreId === store.id;
                    return (
                      <Pressable
                        key={store.id}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => setSelectedStoreId(store.id)}
                        style={({ pressed }) => [
                          styles.storeOption,
                          {
                            borderColor: isSelected
                              ? theme.accentBorderColor?.val ?? theme.color?.val
                              : theme.borderColor?.val,
                            backgroundColor: theme.surface?.val ?? theme.background?.val,
                            opacity: pressed ? 0.92 : 1,
                          },
                        ]}
                      >
                        <Text variant="body" numberOfLines={1}>
                          {store.name}
                        </Text>
                        <Text variant="caption" tone="secondary">
                          {isSelected ? 'Selected' : 'Tap to select'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {createError ? (
                <Text variant="caption" tone="danger">
                  {createError}
                </Text>
              ) : null}

              <Button
                accessibilityLabel="Confirm create shopping list"
                disabled={!canCreateList}
                onPress={() => void handleCreateList()}
                testID="shopping-list-create-confirm"
              >
                {isSavingList ? 'Creating...' : 'Confirm'}
              </Button>
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
    gap: spacing.md,
  },
  stack: {
    gap: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    marginBottom: spacing.xs,
  },
  rowStack: {
    gap: 3,
  },
  row: {
    minHeight: 40,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  colStore: {
    flex: 1.5,
  },
  colDate: {
    flex: 1.2,
  },
  colAmount: {
    flex: 1,
    textAlign: 'right',
  },
  colStatus: {
    flex: 0.8,
    textAlign: 'right',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
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
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  storeOptions: {
    gap: spacing.xs,
  },
  storeOption: {
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: touchTargets.min,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    gap: spacing.xxs,
  },
});
