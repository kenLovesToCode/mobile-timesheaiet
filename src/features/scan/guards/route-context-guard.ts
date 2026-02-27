type GuardDecisionAllow<TContext> = {
  decision: 'allow';
  context: TContext;
};

type GuardDecisionRedirect<TTarget extends string, TParams = undefined> = {
  decision: 'redirect';
  target: TTarget;
  params: TParams;
};

export type ResultsRouteGuardOutcome =
  | GuardDecisionAllow<{ barcode: string }>
  | GuardDecisionRedirect<'/scan'>;

export type AddPriceRouteGuardOutcome =
  | GuardDecisionAllow<{
      barcode: string;
      storeId: number;
      storeName?: string;
      productName?: string;
      priceCents?: number;
      mode: 'add' | 'edit';
    }>
  | GuardDecisionRedirect<'/scan'>
  | GuardDecisionRedirect<'/results', { barcode: string }>;

type ResultsRouteParams = {
  barcode?: string | string[];
};

type AddPriceRouteParams = {
  barcode?: string | string[];
  storeId?: string | string[];
  storeName?: string | string[];
  productName?: string | string[];
  priceCents?: string | string[];
  mode?: string | string[];
};

function normalizeParamString(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = raw?.trim();

  return normalized ? normalized : undefined;
}

function hasRawParamValue(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw?.trim().length ?? 0) > 0;
}

function parseStrictInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return undefined;
  }

  return parsed;
}

export function guardResultsRouteContext(params: ResultsRouteParams): ResultsRouteGuardOutcome {
  const barcode = normalizeParamString(params.barcode);
  if (!barcode) {
    return {
      decision: 'redirect',
      target: '/scan',
      params: undefined,
    };
  }

  return {
    decision: 'allow',
    context: {
      barcode,
    },
  };
}

export function guardAddPriceRouteContext(params: AddPriceRouteParams): AddPriceRouteGuardOutcome {
  const barcode = normalizeParamString(params.barcode);
  if (!barcode) {
    return {
      decision: 'redirect',
      target: '/scan',
      params: undefined,
    };
  }

  const normalizedStoreId = normalizeParamString(params.storeId);
  const parsedStoreId = parseStrictInteger(normalizedStoreId);
  const hasMalformedStoreId = hasRawParamValue(params.storeId) && (!parsedStoreId || parsedStoreId <= 0);
  const hasMissingOrInvalidStoreId = !parsedStoreId || parsedStoreId <= 0;

  const normalizedPriceCents = normalizeParamString(params.priceCents);
  const parsedPriceCents = parseStrictInteger(normalizedPriceCents);
  const hasMalformedPriceCents =
    hasRawParamValue(params.priceCents) && parsedPriceCents == null;

  if (hasMalformedStoreId || hasMissingOrInvalidStoreId || hasMalformedPriceCents) {
    return {
      decision: 'redirect',
      target: '/results',
      params: { barcode },
    };
  }

  return {
    decision: 'allow',
    context: {
      barcode,
      storeId: parsedStoreId,
      storeName: normalizeParamString(params.storeName),
      productName: normalizeParamString(params.productName),
      priceCents: parsedPriceCents,
      mode: normalizeParamString(params.mode) === 'edit' ? 'edit' : 'add',
    },
  };
}
