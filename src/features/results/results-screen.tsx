import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { ListRow } from '../../components/ui/list-row';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import {
  getResultsByBarcodeAcrossActiveStores,
  saveProductNameByBarcode,
  type ResultsLookupRecord,
  type ResultsStorePriceRow,
} from '../../db/repositories/pricing-repository';
import { recordCompletedScanToResults } from '../scan/scan-performance';
import { guardResultsRouteContext } from '../scan/guards/route-context-guard';
import { fetchOpenFoodFactsProductName } from '../pricing/open-food-facts';
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

function formatPriceCents(priceCents: number): string {
  return `₱${(priceCents / 100).toFixed(2)}`;
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
  const rawBarcodeParam = Array.isArray(params.barcode) ? params.barcode[0] : params.barcode;
  const rawSourceParam = Array.isArray(params.source) ? params.source[0] : params.source;
  const routeGuard = useMemo(
    () => guardResultsRouteContext({ barcode: rawBarcodeParam }),
    [rawBarcodeParam]
  );
  const barcode = routeGuard.decision === 'allow' ? routeGuard.context.barcode : undefined;
  const source = rawSourceParam;
  const redirectTarget = routeGuard.decision === 'redirect' ? routeGuard.target : undefined;
  const [screenState, setScreenState] = useState<ResultsScreenState>({ status: 'loading' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshErrorMessage, setRefreshErrorMessage] = useState<string | null>(null);
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [isResolvingOnlineProductName, setIsResolvingOnlineProductName] = useState(false);
  const latestRequestIdRef = useRef(0);
  const latestReadyBarcodeRef = useRef<string | null>(null);
  const focusedBarcodeRef = useRef<string | null>(null);
  const onlineLookupInFlightBarcodeRef = useRef<string | null>(null);
  const isFocusedRef = useRef(false);
  const rowNavigationLatchRef = useRef<{ storeId: number; atMs: number } | null>(null);
  const scanPerformanceFrameRef = useRef<FrameHandle | null>(null);

  const navigateToScanGuardTarget = useCallback(() => {
    if (typeof router.replace === 'function') {
      router.replace('/scan');
      return;
    }

    router.push('/scan');
  }, [router]);

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
    if (routeGuard.decision !== 'redirect') {
      return;
    }

    if (redirectTarget === '/scan') {
      navigateToScanGuardTarget();
    }
  }, [routeGuard.decision, redirectTarget, navigateToScanGuardTarget]);

  const loadResults = useCallback(async () => {
    if (!barcode) {
      latestRequestIdRef.current += 1;
      latestReadyBarcodeRef.current = null;
      setIsRefreshing(false);
      setRefreshErrorMessage(null);
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

  useEffect(() => {
    if (screenState.status !== 'ready') {
      return;
    }

    const currentBarcode = screenState.data.barcode;
    const hasProductName = (screenState.data.productName ?? '').trim().length > 0;

    if (hasProductName) {
      setIsResolvingOnlineProductName(false);
      return;
    }

    if (onlineLookupInFlightBarcodeRef.current === currentBarcode) {
      return;
    }

    let isMounted = true;
    onlineLookupInFlightBarcodeRef.current = currentBarcode;
    setIsResolvingOnlineProductName(true);

    void fetchOpenFoodFactsProductName(currentBarcode)
      .then((remoteName) => {
        if (!isMounted || !remoteName) {
          return;
        }

        setScreenState((prev) => {
          if (prev.status !== 'ready' || prev.data.barcode !== currentBarcode) {
            return prev;
          }
          if ((prev.data.productName ?? '').trim().length > 0) {
            return prev;
          }

          return {
            status: 'ready',
            data: {
              ...prev.data,
              productName: remoteName,
            },
          };
        });

        void saveProductNameByBarcode({ barcode: currentBarcode, productName: remoteName }).catch(
          (error) => {
            console.error('[results] Failed to cache online product name', error);
          }
        );
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }
        console.error('[results] Optional online product lookup failed', error);
      })
      .finally(() => {
        if (!isMounted) {
          return;
        }
        if (onlineLookupInFlightBarcodeRef.current === currentBarcode) {
          onlineLookupInFlightBarcodeRef.current = null;
        }
        setIsResolvingOnlineProductName(false);
      });

    return () => {
      isMounted = false;
    };
  }, [screenState]);

  useFocusEffect(
    useCallback(() => {
      if (routeGuard.decision !== 'allow') {
        return undefined;
      }

      rowNavigationLatchRef.current = null;
      isFocusedRef.current = true;
      focusedBarcodeRef.current = barcode ?? null;
      void loadResults();

      return () => {
        isFocusedRef.current = false;
      };
    }, [routeGuard.decision, barcode, loadResults])
  );

  useEffect(() => {
    setStorePickerOpen(false);

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

  function openStorePicker() {
    if (screenState.status !== 'ready' || sortedStores.length === 0) {
      return;
    }
    setStorePickerOpen(true);
  }

  function closeStorePicker() {
    setStorePickerOpen(false);
  }

  function handleSelectStoreForAdd(row: ResultsStorePriceRow) {
    setStorePickerOpen(false);
    openAddEditFlow(row);
  }

  function openAddEditFlow(row: ResultsStorePriceRow) {
    if (!barcode) {
      return;
    }

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
                <View style={styles.productNameRow}>
                  <Text variant="headline" style={styles.productNameText}>
                    {productNameDisplay}
                  </Text>
                  {isResolvingOnlineProductName ? (
                    <ActivityIndicator size="small" accessibilityLabel="Loading product name" />
                  ) : null}
                </View>
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
                accessibilityLabel="Add product price"
                disabled={!barcode || screenState.status !== 'ready' || sortedStores.length === 0}
                onPress={openStorePicker}
                testID="results-add-product-button"
              >
                Add Product
              </Button>
            </View>
          </Surface>

          {storePickerOpen ? (
            <Modal
              animationType="slide"
              transparent
              onRequestClose={closeStorePicker}
              visible={storePickerOpen}
            >
              <View style={styles.sheetOverlay} testID="results-store-picker-sheet">
                <Pressable
                  accessibilityLabel="Close store picker"
                  onPress={closeStorePicker}
                  style={styles.sheetBackdrop}
                  testID="results-store-picker-backdrop"
                />
                <View
                  style={[
                    styles.sheetContainer,
                    { paddingBottom: Math.max(spacing.md, insets.bottom) },
                  ]}
                >
                  <Surface variant="subtle" style={styles.storePickerSheet}>
                    <Text variant="headline">Select store</Text>
                    <Text variant="caption" tone="secondary">
                      Choose where to add or update this product price.
                    </Text>
                    <ScrollView style={styles.storePickerList} contentContainerStyle={styles.listStack}>
                      {sortedStores.map((row) => {
                        const hasPrice = row.priceCents != null;

                        return (
                          <ListRow
                            key={`picker-${row.storeId}`}
                            title={row.storeName}
                            subtitle={hasPrice ? 'Edit existing price' : 'Add new price'}
                            stateLabel={
                              hasPrice && row.priceCents != null
                                ? formatPriceCents(row.priceCents)
                                : 'Missing'
                            }
                            tone={hasPrice ? 'neutral' : 'missing'}
                            onPress={() => handleSelectStoreForAdd(row)}
                            testID={`results-store-picker-row-${row.storeId}`}
                          />
                        );
                      })}
                    </ScrollView>
                    <View style={styles.sheetActions}>
                      <Button
                        variant="secondary"
                        accessibilityLabel="Cancel store picker"
                        onPress={closeStorePicker}
                        testID="results-store-picker-cancel"
                      >
                        Cancel
                      </Button>
                    </View>
                  </Surface>
                </View>
              </View>
            </Modal>
          ) : null}

          {routeGuard.decision === 'redirect' ? (
            <Surface variant="subtle">
              <View style={styles.centerState}>
                <Text variant="headline">Taking you back to Scan...</Text>
                <Text variant="footnote" tone="secondary">
                  Results requires a barcode from the Scan flow.
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Go to Scan"
                  onPress={navigateToScanGuardTarget}
                  testID="results-guard-scan-button"
                >
                  Go to Scan
                </Button>
              </View>
            </Surface>
          ) : (
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
          )}
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
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  productNameText: {
    flexShrink: 1,
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
  storePickerSheet: {
    gap: spacing.sm,
  },
  storePickerList: {
    maxHeight: 320,
  },
  sheetActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  listStack: {
    marginTop: spacing.md,
    gap: 3,
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
