import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ListRow } from '../../components/ui/list-row';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import {
  getResultsByBarcodeAcrossActiveStores,
  type ResultsLookupRecord,
  type ResultsStorePriceRow,
} from '../../db/repositories/pricing-repository';
import { addOrIncrementShoppingListItem } from '../../db/repositories/shopping-list-repository';
import {
  ShoppingListValidationError,
  SHOPPING_LIST_QUANTITY_MAX,
} from '../../db/validation/shopping-list';
import { recordCompletedScanToResults } from '../scan/scan-performance';
import { recordCompletedResultsRefreshMeasurement } from './results-refresh-performance';
import { spacing } from '../../theme/tokens';

type ResultsRouteParams = {
  barcode?: string | string[];
  source?: string | string[];
};

type ResultsScreenState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'ready'; data: ResultsLookupRecord };

type FrameHandle = ReturnType<typeof setTimeout>;
const ADD_TO_LIST_SUCCESS_DURATION_MS = 2000;

function getParamString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function formatPriceCents(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

function formatCapturedAt(timestamp: number | null): string | undefined {
  if (timestamp == null) {
    return undefined;
  }

  const capturedDate = new Date(timestamp);
  const now = new Date();
  const includeYear = capturedDate.getFullYear() !== now.getFullYear();

  return `Updated ${capturedDate.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: includeYear ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function scheduleAfterRender(cb: () => void): FrameHandle {
  return setTimeout(cb, 0);
}

function cancelScheduled(handle: FrameHandle | null): void {
  if (handle == null) {
    return;
  }

  clearTimeout(handle);
}

export function ResultsFeatureScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<ResultsRouteParams>();
  const barcode = getParamString(params.barcode)?.trim();
  const source = getParamString(params.source);
  const [screenState, setScreenState] = useState<ResultsScreenState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshErrorMessage, setRefreshErrorMessage] = useState<string | null>(null);
  const [quantitySheetOpen, setQuantitySheetOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [addToListError, setAddToListError] = useState<string | null>(null);
  const [addToListSuccess, setAddToListSuccess] = useState<string | null>(null);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const latestRequestIdRef = useRef(0);
  const latestReadyBarcodeRef = useRef<string | null>(null);
  const focusedBarcodeRef = useRef<string | null>(null);
  const isFocusedRef = useRef(false);
  const rowNavigationLatchRef = useRef<{ storeId: number; atMs: number } | null>(null);
  const scanPerformanceFrameRef = useRef<FrameHandle | null>(null);
  const addToListMessageTimerRef = useRef<FrameHandle | null>(null);

  const sortedStores = useMemo(() => {
    if (screenState.status !== 'ready') {
      return [];
    }

    return [...screenState.data.stores].sort((a, b) => {
      const nameComparison = a.storeName.localeCompare(b.storeName);
      if (nameComparison !== 0) {
        return nameComparison;
      }
      return a.storeId - b.storeId;
    });
  }, [screenState]);

  const hasRows = screenState.status === 'ready' && sortedStores.length > 0;
  const productName =
    screenState.status === 'ready' ? screenState.data.productName ?? 'Unknown product' : null;
  const productNameDisplay =
    screenState.status === 'error' ? null : productName ?? 'Loading product...';
  const identityAccessibilityLabel =
    screenState.status === 'error'
      ? undefined
      : `Product ${productNameDisplay ?? 'Loading product'}, ${barcode ? `barcode ${barcode}` : 'barcode not provided'}`;

  const storeCountLabel = useMemo(() => {
    if (screenState.status !== 'ready') {
      return null;
    }

    const count = sortedStores.length;
    return `${count} active store${count === 1 ? '' : 's'}`;
  }, [screenState, sortedStores]);

  useEffect(() => {
    return () => {
      cancelScheduled(addToListMessageTimerRef.current);
      addToListMessageTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    resetAddToListFeedback();
  }, [barcode]);

  function resetAddToListFeedback() {
    setAddToListError(null);
    setAddToListSuccess(null);
    cancelScheduled(addToListMessageTimerRef.current);
    addToListMessageTimerRef.current = null;
  }

  function scheduleAddToListMessageClear() {
    cancelScheduled(addToListMessageTimerRef.current);
    addToListMessageTimerRef.current = setTimeout(() => {
      setAddToListSuccess(null);
      addToListMessageTimerRef.current = null;
    }, ADD_TO_LIST_SUCCESS_DURATION_MS);
  }

  function openQuantitySheet() {
    setQuantitySheetOpen(true);
    setQuantityInput('1');
    resetAddToListFeedback();
  }

  function closeQuantitySheet() {
    setQuantitySheetOpen(false);
    setAddToListError(null);
  }

  function parseQuantityInput(value: string): { quantity?: number; error?: string } {
    const trimmed = value.trim();
    if (!trimmed) {
      return { error: 'Quantity is required.' };
    }
    if (!/^\d+$/.test(trimmed)) {
      return { error: 'Enter a whole number.' };
    }
    const quantity = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return { error: 'Quantity must be at least 1.' };
    }
    if (quantity > SHOPPING_LIST_QUANTITY_MAX) {
      return { error: 'Quantity is too large.' };
    }
    return { quantity };
  }

  async function handleAddToList() {
    if (!barcode || isAddingToList) {
      return;
    }

    const parsed = parseQuantityInput(quantityInput);
    if (!parsed.quantity) {
      setAddToListError(parsed.error ?? 'Enter a valid quantity.');
      return;
    }

    setIsAddingToList(true);
    resetAddToListFeedback();

    try {
      await addOrIncrementShoppingListItem({
        barcode,
        quantity: parsed.quantity,
        productName:
          screenState.status === 'ready' && screenState.data.productName
            ? screenState.data.productName
            : undefined,
      });
      setQuantitySheetOpen(false);
      setAddToListSuccess('Added to Shopping List.');
      scheduleAddToListMessageClear();
    } catch (error) {
      if (error instanceof ShoppingListValidationError) {
        setAddToListError(error.message);
      } else {
        console.error('[results] Failed to add to shopping list', error);
        setAddToListError('Could not add to Shopping List right now.');
      }
    } finally {
      setIsAddingToList(false);
    }
  }

  const loadResults = useCallback(async () => {
    if (!barcode) {
      latestRequestIdRef.current += 1;
      latestReadyBarcodeRef.current = null;
      setIsRefreshing(false);
      setRefreshErrorMessage(null);
      setScreenState({
        status: 'error',
        message: 'Missing barcode context. Return to Scan and open Results again.',
      });
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    const hasReadyRowsForBarcode = latestReadyBarcodeRef.current === barcode;

    if (hasReadyRowsForBarcode) {
      setIsRefreshing(true);
      setRefreshErrorMessage(null);
    } else {
      setScreenState({ status: 'loading' });
      setIsRefreshing(false);
      setRefreshErrorMessage(null);
    }

    try {
      const data = await getResultsByBarcodeAcrossActiveStores({ barcode });

      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      latestReadyBarcodeRef.current = data.barcode;
      setRefreshErrorMessage(null);
      // NOTE: This measurement captures fetch completion to state update, not a rendered frame.
      recordCompletedResultsRefreshMeasurement(data.barcode);
      setScreenState({ status: 'ready', data });
    } catch (error) {
      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      console.error('[results] Failed to load rows', error);

      if (!hasReadyRowsForBarcode) {
        latestReadyBarcodeRef.current = null;
        setRefreshErrorMessage(null);
        setScreenState({ status: 'error', message: 'Could not load results' });
      } else {
        setRefreshErrorMessage('Could not refresh prices. Showing the last loaded results.');
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [barcode]);

  useEffect(() => {
    if (screenState.status !== 'ready') {
      return;
    }
    if (source !== 'scan') {
      return;
    }
    cancelScheduled(scanPerformanceFrameRef.current);
    scanPerformanceFrameRef.current = scheduleAfterRender(() => {
      recordCompletedScanToResults(screenState.data.barcode);
      scanPerformanceFrameRef.current = null;
    });

    return () => {
      cancelScheduled(scanPerformanceFrameRef.current);
      scanPerformanceFrameRef.current = null;
    };
  }, [screenState, source]);

  useFocusEffect(
    useCallback(() => {
      rowNavigationLatchRef.current = null;
      isFocusedRef.current = true;
      focusedBarcodeRef.current = barcode ?? null;
      void loadResults();

      return () => {
        isFocusedRef.current = false;
      };
    }, [barcode, loadResults])
  );

  useEffect(() => {
    if (!isFocusedRef.current) {
      focusedBarcodeRef.current = barcode ?? null;
      return;
    }

    const currentBarcode = barcode ?? null;
    if (focusedBarcodeRef.current === currentBarcode) {
      return;
    }

    focusedBarcodeRef.current = currentBarcode;
    void loadResults();
  }, [barcode, loadResults]);

  function openAddEditFlow(row: ResultsStorePriceRow) {
    const lastNavigation = rowNavigationLatchRef.current;
    const now = Date.now();
    if (
      lastNavigation &&
      lastNavigation.storeId === row.storeId &&
      now - lastNavigation.atMs < 800
    ) {
      return;
    }
    rowNavigationLatchRef.current = { storeId: row.storeId, atMs: now };
    const isEdit = row.priceCents != null;

    router.push({
      pathname: '/add-price',
      params: {
        barcode,
        storeId: String(row.storeId),
        storeName: row.storeName,
        mode: isEdit ? 'edit' : 'add',
        productName:
          screenState.status === 'ready' && screenState.data.productName
            ? screenState.data.productName
            : undefined,
        priceCents: isEdit ? String(row.priceCents) : undefined,
      },
    });
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
            <Text variant="title">Results</Text>
            <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
              Add a missing store price or edit an existing one for this barcode.
            </Text>
            <View
              accessible
              accessibilityLabel={identityAccessibilityLabel}
              style={styles.identityStack}
            >
              {productNameDisplay ? (
                <Text variant="headline">{productNameDisplay}</Text>
              ) : null}
              <Text variant="footnote" tone="secondary">
                Barcode: {barcode ?? 'Not provided'}
              </Text>
              {storeCountLabel ? (
                <Text variant="caption" tone="secondary">
                  {storeCountLabel}
                </Text>
              ) : null}
            </View>

            <View style={styles.addToListStack}>
              <Button
                accessibilityLabel="Add item to shopping list"
                disabled={!barcode || isAddingToList || screenState.status !== 'ready'}
                onPress={openQuantitySheet}
                testID="results-add-to-list-button"
              >
                Add to List
              </Button>
              {addToListSuccess ? (
                <Text
                  variant="caption"
                  tone="success"
                  testID="results-add-to-list-success"
                >
                  {addToListSuccess}
                </Text>
              ) : null}
            </View>
          </Surface>

          {quantitySheetOpen ? (
            <Modal
              animationType="slide"
              transparent
              onRequestClose={closeQuantitySheet}
              visible={quantitySheetOpen}
            >
              <View style={styles.sheetOverlay} testID="results-quantity-sheet">
                <Pressable
                  accessibilityLabel="Close quantity sheet"
                  onPress={closeQuantitySheet}
                  style={styles.sheetBackdrop}
                  testID="results-quantity-backdrop"
                />
                <KeyboardAvoidingView
                  behavior={Platform.select({ ios: 'padding', default: undefined })}
                >
                  <View
                    style={[
                      styles.sheetContainer,
                      { paddingBottom: Math.max(spacing.md, insets.bottom) },
                    ]}
                  >
                    <Surface variant="subtle" style={styles.quantitySheet}>
                      <Text variant="headline">Choose quantity</Text>
                      <Text variant="caption" tone="secondary">
                        Set how many you want to track in your list.
                      </Text>
                      <View style={styles.quantityForm}>
                        <Input
                          label="Quantity"
                          value={quantityInput}
                          onChangeText={setQuantityInput}
                          keyboardType="number-pad"
                          autoCapitalize="none"
                          helperText="Whole numbers only."
                          testID="results-quantity-input"
                        />
                        {addToListError ? (
                          <Text
                            variant="footnote"
                            tone="danger"
                            testID="results-add-to-list-error"
                          >
                            {addToListError}
                          </Text>
                        ) : null}
                        <View style={styles.quantityActions}>
                          <Button
                            variant="secondary"
                            disabled={isAddingToList}
                            accessibilityLabel="Cancel add to list"
                            onPress={closeQuantitySheet}
                            testID="results-quantity-cancel"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={isAddingToList}
                            accessibilityLabel="Save shopping list quantity"
                            onPress={() => void handleAddToList()}
                            testID="results-quantity-save"
                          >
                            Save to List
                          </Button>
                        </View>
                      </View>
                    </Surface>
                  </View>
                </KeyboardAvoidingView>
              </View>
            </Modal>
          ) : null}

          <Surface variant="subtle">
            <Text variant="headline">Store prices</Text>
            <Text variant="caption" tone="secondary" style={styles.sectionLead}>
              Tap Missing to add a price, or tap an existing price to update it.
            </Text>
            {screenState.status === 'ready' && isRefreshing ? (
              <Text
                variant="caption"
                tone="secondary"
                style={styles.refreshingLabel}
                testID="results-refreshing-indicator"
              >
                Refreshing prices...
              </Text>
            ) : null}
            {screenState.status === 'ready' && refreshErrorMessage ? (
              <View style={styles.refreshErrorRow} testID="results-refresh-error">
                <Text variant="caption" tone="danger" style={styles.refreshErrorText}>
                  {refreshErrorMessage}
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Retry refreshing prices"
                  onPress={() => void loadResults()}
                  testID="results-refresh-retry-button"
                >
                  Retry
                </Button>
              </View>
            ) : null}

            {screenState.status === 'loading' ? (
              <View style={styles.centerState}>
                <ActivityIndicator accessibilityRole="progressbar" />
                <Text variant="footnote" tone="secondary">
                  Loading results...
                </Text>
              </View>
            ) : null}

            {screenState.status === 'error' ? (
              <View style={styles.centerState}>
                <Text variant="headline" tone="danger">
                  {screenState.message ?? 'Could not load results'}
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Retry loading results"
                  onPress={() => void loadResults()}
                  testID="results-retry-button"
                >
                  Retry
                </Button>
                {!barcode ? (
                  <Button
                    variant="secondary"
                    accessibilityLabel="Return to Scan"
                    onPress={() => router.push('/scan')}
                    testID="results-scan-button"
                  >
                    Go to Scan
                  </Button>
                ) : null}
              </View>
            ) : null}

            {screenState.status === 'ready' && !hasRows ? (
              <View style={styles.centerState}>
                <Text variant="body">No active stores to compare yet.</Text>
                <Text variant="footnote" tone="secondary">
                  Activate a store in Stores to start adding prices here.
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Manage stores"
                  onPress={() => router.push('/stores')}
                  testID="results-manage-stores-button"
                >
                  Manage Stores
                </Button>
              </View>
            ) : null}

            {screenState.status === 'ready' && hasRows ? (
              <View style={styles.listStack}>
                {sortedStores.map((row) => {
                  const hasPrice = row.priceCents != null;

                  return (
                    <ListRow
                      key={row.storeId}
                      title={row.storeName}
                      subtitle={hasPrice ? 'Tap to edit price' : 'Tap to add price'}
                      meta={hasPrice ? formatCapturedAt(row.capturedAt) : undefined}
                      stateLabel={
                        hasPrice && row.priceCents != null
                          ? formatPriceCents(row.priceCents)
                          : 'Missing'
                      }
                      tone={hasPrice ? 'neutral' : 'missing'}
                      onPress={() => openAddEditFlow(row)}
                      testID={`results-store-row-${row.storeId}`}
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
  identityStack: {
    marginTop: spacing.md,
    gap: spacing.xxs,
  },
  addToListStack: {
    marginTop: spacing.md,
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    padding: spacing.md,
  },
  quantitySheet: {
    gap: spacing.sm,
  },
  quantityForm: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  quantityActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  listStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  refreshingLabel: {
    marginTop: spacing.sm,
  },
  refreshErrorRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  refreshErrorText: {
    flexShrink: 1,
  },
  centerState: {
    marginTop: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
});
