const allowedBarcodeLengths = new Set([8, 12, 13]);

export function normalizeBarcodeValue(rawValue: unknown): string | null {
  const digitsOnly = String(rawValue ?? '')
    .trim()
    .replace(/\D+/g, '');

  if (!digitsOnly) {
    return null;
  }

  if (!allowedBarcodeLengths.has(digitsOnly.length)) {
    return null;
  }

  return digitsOnly;
}

export function isValidBarcodeValue(rawValue: unknown): boolean {
  return normalizeBarcodeValue(rawValue) !== null;
}
