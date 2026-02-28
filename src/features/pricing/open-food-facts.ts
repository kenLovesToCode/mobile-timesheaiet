type OpenFoodFactsProduct = {
  product_name_en?: string | null;
  product_name?: string | null;
  quantity?: string | null;
};

type OpenFoodFactsResponse = {
  status?: number;
  product?: OpenFoodFactsProduct | null;
};

export async function fetchOpenFoodFactsProductName(barcode: string): Promise<string | null> {
  console.info('[open-food-facts] fetch:start', { barcode });
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
    barcode
  )}.json?fields=code,product_name,brands,quantity,categories,image_front_url&product_type=all`;

  const response = await fetch(url);
  if (!response.ok) {
    console.info('[open-food-facts] fetch:http-error', {
      barcode,
      status: response.status,
    });
    return null;
  }

  const result = (await response.json()) as OpenFoodFactsResponse;
  if (result.status === 0) {
    console.info('[open-food-facts] fetch:not-found', { barcode });
    return null;
  }
  if (result.status !== 1) {
    console.info('[open-food-facts] fetch:unexpected-status', {
      barcode,
      status: result.status,
    });
    return null;
  }

  const baseName = result.product?.product_name_en || result.product?.product_name || '';
  const quantity = result.product?.quantity || '';
  const composedName = [baseName.trim(), quantity.trim()].filter(Boolean).join(' ').trim();

  console.info('[open-food-facts] fetch:success', {
    barcode,
    hasName: composedName.length > 0,
  });

  return composedName.length > 0 ? composedName : null;
}
