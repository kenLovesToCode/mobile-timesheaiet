import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
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
import { spacing } from '../../theme/tokens';

type AddPriceRouteParams = {
  barcode?: string | string[];
  storeId?: string | string[];
  storeName?: string | string[];
  productName?: string | string[];
  priceCents?: string | string[];
  mode?: string | string[];
};

function getParamString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function hasParamValue(value: string | undefined): boolean {
  return (value?.trim().length ?? 0) > 0;
}

function parseStrictIntegerParam(value: string | undefined): number | undefined {
  const normalized = value?.trim();

  if (!normalized) {
    return undefined;
  }

  if (!/^\d+$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed)) {
    return undefined;
  }

  return parsed;
}

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

  const barcode = getParamString(params.barcode)?.trim() || undefined;
  const storeIdParam = getParamString(params.storeId);
  const storeName = getParamString(params.storeName);
  const productNameParam = getParamString(params.productName);
  const priceCentsParam = getParamString(params.priceCents);
  const mode = getParamString(params.mode) === 'edit' ? 'edit' : 'add';
  const parsedStoreId = parseStrictIntegerParam(storeIdParam);
  const parsedInitialPriceCents = parseStrictIntegerParam(priceCentsParam);
  const initialProductName = productNameParam ?? '';
  const initialPriceCents = parsedInitialPriceCents ?? null;
  const routeSignature = `${barcode ?? ''}|${storeIdParam ?? ''}|${productNameParam ?? ''}|${priceCentsParam ?? ''}|${mode}`;
  const hasMalformedStoreIdParam = hasParamValue(storeIdParam) && (!parsedStoreId || parsedStoreId <= 0);
  const hasMalformedPriceCentsParam = hasParamValue(priceCentsParam) && parsedInitialPriceCents == null;
  const hasMalformedNumericRouteParams = hasMalformedStoreIdParam || hasMalformedPriceCentsParam;
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
  const saveInFlightRef = useRef(false);
  const productNameEditedRef = useRef(false);

  const hasStoreContextIssue = !hasValidStoreId || (!isResolvingStoreContext && !verifiedStoreName);
  const isMissingRequiredContext = !barcode || hasMalformedNumericRouteParams || hasStoreContextIssue;
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

    setIsResolvingStoreContext(true);
    setStoreContextError(null);
    setStoreContextNotice(null);

    void getStoreById(storeId)
      .then((store) => {
        if (!isMounted) {
          return;
        }

        if (!store) {
          setVerifiedStoreName(null);
          setStoreContextError('Selected store could not be found. Return to Results and try again.');
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
  }, [hasValidStoreId, parsedStoreId, storeName]);

  useEffect(() => {
    let isMounted = true;

    if (!barcode) {
      setCanonicalProductName(null);
      setIsResolvingProductContext(false);
      setDidProductContextLookupFail(false);
      return;
    }

    setIsResolvingProductContext(true);
    setDidProductContextLookupFail(false);

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
  }, [barcode]);

  const handleExitToResults = useCallback(() => {
    if (router.canGoBack?.()) {
      router.back();
      return;
    }

    if (barcode) {
      router.replace({ pathname: '/results', params: { barcode } });
      return;
    }

    router.back();
  }, [barcode, router]);

  async function handleSave() {
    if (saveInFlightRef.current || isSaving || isMissingRequiredContext || isResolvingStoreContext) {
      return;
    }
    const storeId = parsedStoreId;
    if (storeId == null) {
      return;
    }

    setFormError(null);

    const normalizedProductName = productName.trim();
    if (productNameWasMissing && normalizedProductName.length === 0) {
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

            {isResolvingStoreContext && barcode && hasValidStoreId ? (
              <View style={styles.formStack}>
                <Text variant="headline">Verifying store context...</Text>
                <Text variant="footnote" tone="secondary">
                  Checking that the selected store still matches the saved record before editing.
                </Text>
                <Button
                  variant="secondary"
                  onPress={handleExitToResults}
                  accessibilityLabel="Go back to results"
                  testID="add-price-verifying-back-button"
                >
                  Go Back
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
                <Input
                  label="Store"
                  value={verifiedStoreName ?? (isResolvingStoreContext ? 'Loading store...' : '')}
                  editable={false}
                  helperText={
                    isResolvingStoreContext
                      ? 'Verifying selected store context...'
                      : storeContextNotice ?? undefined
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
                <Input
                  label="Product name"
                  value={productName}
                  onChangeText={handleProductNameChange}
                  autoCapitalize="words"
                  placeholder="e.g. Greek Yogurt"
                  helperText={
                    isResolvingProductContext && normalizedInitialProductName.length === 0
                      ? 'Checking for a saved product name for this barcode...'
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
                  helperText="Enter a local store price in dollars."
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
  actionsRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
