import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import { getProductByBarcode, saveStorePrice } from '../../db/repositories/pricing-repository';
import { getStoreById } from '../../db/repositories/store-repository';
import { PricingValidationError } from '../../db/validation/pricing';
import { markPendingResultsRefreshMeasurement } from '../results/results-refresh-performance';
import { guardAddPriceRouteContext } from '../scan/guards/route-context-guard';
import { fetchOpenFoodFactsProductName } from './open-food-facts';
import { spacing } from '../../theme/tokens';

type AddPriceRouteParams = {
  barcode?: string | string[];
  storeId?: string | string[];
  storeName?: string | string[];
  productName?: string | string[];
  priceCents?: string | string[];
  mode?: string | string[];
};

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

export function AddEditPriceFeatureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<AddPriceRouteParams>();
  const rawBarcodeParam = Array.isArray(params.barcode) ? params.barcode[0] : params.barcode;
  const rawStoreIdParam = Array.isArray(params.storeId) ? params.storeId[0] : params.storeId;
  const rawStoreNameParam = Array.isArray(params.storeName) ? params.storeName[0] : params.storeName;
  const rawProductNameParam = Array.isArray(params.productName)
    ? params.productName[0]
    : params.productName;
  const rawPriceCentsParam = Array.isArray(params.priceCents) ? params.priceCents[0] : params.priceCents;
  const rawModeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const routeGuard = useMemo(
    () =>
      guardAddPriceRouteContext({
        barcode: rawBarcodeParam,
        storeId: rawStoreIdParam,
        storeName: rawStoreNameParam,
        productName: rawProductNameParam,
        priceCents: rawPriceCentsParam,
        mode: rawModeParam,
      }),
    [
      rawBarcodeParam,
      rawStoreIdParam,
      rawStoreNameParam,
      rawProductNameParam,
      rawPriceCentsParam,
      rawModeParam,
    ]
  );
  const routeContext = routeGuard.decision === 'allow' ? routeGuard.context : null;
  const redirectTarget = routeGuard.decision === 'redirect' ? routeGuard.target : undefined;
  const redirectBarcode =
    routeGuard.decision === 'redirect' && routeGuard.target === '/results'
      ? routeGuard.params.barcode
      : undefined;
  const barcode = routeContext?.barcode;
  const parsedStoreId = routeContext?.storeId;
  const storeName = routeContext?.storeName;
  const mode = routeContext?.mode ?? 'add';
  const initialProductName = routeContext?.productName ?? '';
  const initialPriceCents = routeContext?.priceCents ?? null;
  const routeSignature = routeContext
    ? `${routeContext.barcode}|${routeContext.storeId}|${routeContext.productName ?? ''}|${routeContext.priceCents ?? ''}|${routeContext.mode}`
    : (redirectTarget ?? 'redirect');
  const hasValidStoreId = parsedStoreId != null && parsedStoreId > 0;

  const [productName, setProductName] = useState(initialProductName);
  const [priceInput, setPriceInput] = useState(formatCentsForInput(initialPriceCents));
  const [formError, setFormError] = useState<string | null>(null);
  const [storeContextError, setStoreContextError] = useState<string | null>(null);
  const [storeContextNotice, setStoreContextNotice] = useState<string | null>(null);
  const [verifiedStoreName, setVerifiedStoreName] = useState<string | null>(null);
  const [isResolvingStoreContext, setIsResolvingStoreContext] = useState(hasValidStoreId);
  const [isSaving, setIsSaving] = useState(false);
  const [canonicalProductName, setCanonicalProductName] = useState<string | null>(null);
  const [isResolvingProductContext, setIsResolvingProductContext] = useState(false);
  const [didProductContextLookupFail, setDidProductContextLookupFail] = useState(false);
  const [isFetchingOnlineProductName, setIsFetchingOnlineProductName] = useState(false);
  const saveInFlightRef = useRef(false);
  const productNameEditedRef = useRef(false);

  const hasStoreContextIssue = !hasValidStoreId || (!isResolvingStoreContext && !verifiedStoreName);
  const isMissingRequiredContext = !barcode || hasStoreContextIssue;
  const normalizedInitialProductName = initialProductName.trim();
  const normalizedCanonicalProductName = canonicalProductName?.trim() ?? '';
  const isCanonicalProductKnown = normalizedCanonicalProductName.length > 0;
  const productNameWasMissing =
    !isResolvingProductContext &&
    !didProductContextLookupFail &&
    !isCanonicalProductKnown &&
    normalizedInitialProductName.length === 0;

  const screenTitle = mode === 'edit' ? 'Edit Price' : 'Add Price';
  const ctaLabel = mode === 'edit' ? 'Save Changes' : 'Save Price';

  const helperText = useMemo(() => {
    if (mode === 'edit') {
      return 'Update the store price and optional product name correction.';
    }

    return 'Store and barcode are prefilled from the selected Results row.';
  }, [mode]);

  const navigateToSafeResults = useCallback(() => {
    if (barcode) {
      router.replace({ pathname: '/results', params: { barcode } });
      return;
    }

    router.replace('/scan');
  }, [barcode, router]);

  useEffect(() => {
    if (routeGuard.decision !== 'redirect') {
      return;
    }

    if (redirectTarget === '/scan') {
      router.replace('/scan');
      return;
    }

    if (redirectBarcode) {
      router.replace({ pathname: '/results', params: { barcode: redirectBarcode } });
    }
  }, [routeGuard.decision, redirectTarget, redirectBarcode, router]);

  const resetFormState = useCallback(() => {
    setProductName(initialProductName);
    setPriceInput(formatCentsForInput(initialPriceCents));
    setFormError(null);
    setStoreContextError(null);
    setStoreContextNotice(null);
    setVerifiedStoreName(null);
    setIsResolvingStoreContext(hasValidStoreId);
    setCanonicalProductName(null);
    setIsResolvingProductContext(false);
    setDidProductContextLookupFail(false);
    setIsFetchingOnlineProductName(false);
    setIsSaving(false);
    saveInFlightRef.current = false;
    productNameEditedRef.current = false;
  }, [initialPriceCents, initialProductName, hasValidStoreId]);

  useEffect(() => {
    resetFormState();
  }, [resetFormState, routeSignature]);

  useFocusEffect(
    useCallback(() => {
      resetFormState();

      return () => {
        resetFormState();
      };
    }, [resetFormState])
  );

  useEffect(() => {
    let isMounted = true;

    if (!hasValidStoreId) {
      setVerifiedStoreName(null);
      setStoreContextError(null);
      setStoreContextNotice(null);
      setIsResolvingStoreContext(false);
      return;
    }

    const storeId = parsedStoreId;
    if (storeId == null) {
      setVerifiedStoreName(null);
      setStoreContextError(null);
      setStoreContextNotice(null);
      setIsResolvingStoreContext(false);
      return;
    }

    void getStoreById(storeId)
      .then((store) => {
        if (!isMounted) {
          return;
        }

        if (!store) {
          setVerifiedStoreName(null);
          navigateToSafeResults();
          return;
        }

        setVerifiedStoreName(store.name);
        const routeStoreName = storeName?.trim();
        if (routeStoreName && routeStoreName !== store.name) {
          setStoreContextNotice('Store name changed. Using the current saved store name.');
        } else {
          setStoreContextNotice(null);
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.error('[pricing] Failed to verify store context', error);
        setVerifiedStoreName(null);
        setStoreContextError('Could not verify store context right now.');
        setStoreContextNotice(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsResolvingStoreContext(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasValidStoreId, parsedStoreId, storeName, navigateToSafeResults]);

  useEffect(() => {
    let isMounted = true;

    if (!barcode) {
      setCanonicalProductName(null);
      setIsResolvingProductContext(false);
      setDidProductContextLookupFail(false);
      setIsFetchingOnlineProductName(false);
      return;
    }

    setIsResolvingProductContext(true);
    setDidProductContextLookupFail(false);
    setIsFetchingOnlineProductName(false);

    void Promise.resolve(getProductByBarcode({ barcode }))
      .then((product) => {
        if (!isMounted) {
          return;
        }

        const canonicalName = typeof product?.name === 'string' ? product.name : null;
        setCanonicalProductName(canonicalName);
        if (canonicalName && !productNameEditedRef.current) {
          setProductName((currentValue) => {
            if (productNameEditedRef.current) {
              return currentValue;
            }

            if (currentValue.trim() === canonicalName.trim()) {
              return currentValue;
            }

            return canonicalName;
          });
        }

        if (canonicalName || normalizedInitialProductName.length > 0) {
          return;
        }

        setIsFetchingOnlineProductName(true);
        void fetchOpenFoodFactsProductName(barcode)
          .then((remoteName) => {
            if (!isMounted) {
              return;
            }
            if (!remoteName || productNameEditedRef.current) {
              return;
            }

            setProductName((currentValue) => {
              if (productNameEditedRef.current || currentValue.trim().length > 0) {
                return currentValue;
              }
              return remoteName;
            });
          })
          .catch((error) => {
            if (!isMounted) {
              return;
            }
            console.error('[pricing] Optional online product lookup failed', error);
          })
          .finally(() => {
            if (isMounted) {
              setIsFetchingOnlineProductName(false);
            }
          });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        console.error('[pricing] Failed to load canonical product context', error);
        setCanonicalProductName(null);
        setDidProductContextLookupFail(true);
      })
      .finally(() => {
        if (isMounted) {
          setIsResolvingProductContext(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [barcode, normalizedInitialProductName]);

  const handleExitToResults = useCallback(() => {
    navigateToSafeResults();
  }, [navigateToSafeResults]);

  function handleGuardCta() {
    if (routeGuard.decision !== 'redirect') {
      return;
    }

    if (routeGuard.target === '/scan') {
      router.replace('/scan');
      return;
    }

    router.replace({ pathname: '/results', params: { barcode: routeGuard.params.barcode } });
  }

  async function handleSave() {
    if (
      saveInFlightRef.current ||
      isSaving ||
      isMissingRequiredContext
    ) {
      return;
    }
    const storeId = parsedStoreId;
    if (storeId == null) {
      return;
    }

    setFormError(null);

    const normalizedProductName = productName.trim();
    const isProductNameRequiredForSave =
      normalizedProductName.length === 0 &&
      normalizedInitialProductName.length === 0 &&
      !isCanonicalProductKnown &&
      !didProductContextLookupFail;
    if (isProductNameRequiredForSave) {
      setFormError('Product name is required before saving a new price.');
      return;
    }

    const priceCents = parsePriceInputToCents(priceInput);
    if (priceCents == null) {
      setFormError('Enter a valid price (for example 3.99).');
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);

    try {
      const baselineProductName = isCanonicalProductKnown
        ? normalizedCanonicalProductName
        : normalizedInitialProductName;
      const shouldSendProductName =
        normalizedProductName.length > 0 &&
        (baselineProductName.length === 0 || normalizedProductName !== baselineProductName);

      await saveStorePrice({
        barcode,
        storeId,
        priceCents,
        productName: shouldSendProductName ? normalizedProductName : undefined,
      });
      markPendingResultsRefreshMeasurement(barcode);
      router.back();
    } catch (error) {
      if (error instanceof PricingValidationError) {
        setFormError(error.message);
      } else {
        console.error('[pricing] Failed to save price', error);
        setFormError('Could not save price right now.');
      }
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  function handleProductNameChange(nextValue: string) {
    productNameEditedRef.current = true;
    setProductName(nextValue);
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.flex}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Surface>
            <Text variant="title">{screenTitle}</Text>
            <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
              {helperText}
            </Text>

            {routeGuard.decision === 'redirect' ? (
              <View style={styles.formStack}>
                <Text variant="headline">
                  {routeGuard.target === '/scan'
                    ? 'Redirecting to Scan...'
                    : 'Redirecting to Results...'}
                </Text>
                <Text variant="footnote" tone="secondary">
                  {routeGuard.target === '/scan'
                    ? 'Add Price requires a barcode from the scan flow.'
                    : 'Add Price requires a store context from Results.'}
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Continue to valid flow"
                  onPress={handleGuardCta}
                  testID="add-price-guard-redirect-button"
                >
                  Continue
                </Button>
              </View>
            ) : isMissingRequiredContext ? (
              <View style={styles.formStack}>
                <Text variant="headline" tone="danger">
                  {storeContextError ? 'Store context issue' : 'Missing price context'}
                </Text>
                <Text variant="footnote" tone="secondary">
                  {storeContextError ??
                    'Return to Results and choose a store row to start the add/edit price flow.'}
                </Text>
                <Button
                  variant="secondary"
                  accessibilityLabel="Go back to results"
                  onPress={handleExitToResults}
                  testID="add-price-missing-context-back-button"
                >
                  Go Back
                </Button>
              </View>
            ) : (
              <View style={styles.formStack}>
                {isResolvingStoreContext ? (
                  <>
                    <Text variant="headline">Verifying store context...</Text>
                    <Button
                      variant="secondary"
                      onPress={handleExitToResults}
                      accessibilityLabel="Go back to results"
                      testID="add-price-verifying-back-button"
                    >
                      Go Back
                    </Button>
                  </>
                ) : null}
                <Input
                  label="Store"
                  value={verifiedStoreName ?? (isResolvingStoreContext ? 'Loading store...' : '')}
                  editable={false}
                  helperText={
                    storeContextNotice ??
                    (isResolvingStoreContext ? 'Verifying selected store context...' : undefined)
                  }
                  testID="add-price-store-input"
                />
                <Input
                  label="Barcode"
                  value={barcode}
                  editable={false}
                  autoCapitalize="none"
                  testID="add-price-barcode-input"
                />
                <View style={styles.productNameLabelRow}>
                  <Text variant="footnote" tone="secondary">
                    Product name
                  </Text>
                  {isFetchingOnlineProductName ? (
                    <Text variant="caption" tone="secondary" style={styles.fetchingLabel}>
                      fetching...
                    </Text>
                  ) : null}
                </View>
                <Input
                  value={productName}
                  onChangeText={handleProductNameChange}
                  autoCapitalize="words"
                  placeholder="e.g. Greek Yogurt"
                  rightAccessory={
                    isFetchingOnlineProductName ? (
                      <ActivityIndicator size="small" />
                    ) : null
                  }
                  helperText={
                    isResolvingProductContext && normalizedInitialProductName.length === 0
                      ? 'Checking for a saved product name for this barcode...'
                      : isFetchingOnlineProductName
                        ? 'Fetching optional product name from OpenFoodFacts...'
                      : didProductContextLookupFail && normalizedInitialProductName.length === 0
                        ? 'Could not verify an existing product name right now. You can still save and validation will run during save.'
                      : productNameWasMissing
                        ? 'Required because this barcode does not have a saved product name yet.'
                        : 'Optional correction if the product name needs an update.'
                  }
                  testID="add-price-product-name-input"
                />
                <Input
                  label="Price"
                  value={priceInput}
                  onChangeText={setPriceInput}
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                  placeholder="0.00"
                  helperText="Enter a local store price in Php."
                  testID="add-price-value-input"
                />

                {formError ? (
                  <Text variant="footnote" tone="danger" testID="add-price-form-error">
                    {formError}
                  </Text>
                ) : null}

                <View style={styles.actionsRow}>
                  <Button
                    variant="secondary"
                    disabled={isSaving}
                    onPress={handleExitToResults}
                    accessibilityLabel="Cancel add or edit price"
                    testID="add-price-cancel-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isSaving}
                    onPress={() => void handleSave()}
                    accessibilityLabel={ctaLabel}
                    testID="add-price-save-button"
                  >
                    {ctaLabel}
                  </Button>
                </View>
              </View>
            )}
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.xs,
  },
  formStack: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  productNameLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -4,
  },
  fetchingLabel: {
    fontStyle: 'italic',
  },
  actionsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
