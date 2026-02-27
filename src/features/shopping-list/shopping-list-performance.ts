export type ShoppingListOpenSample = {
  durationMs: number;
  measuredAtMs: number;
};

type ShoppingListOpenSummary = {
  count: number;
  p95Ms: number | null;
  maxMs: number | null;
  latestSample: ShoppingListOpenSample | null;
};

type ShoppingListOpenSummaryOptions = {
  sinceMeasuredAtMs?: number;
};

const MAX_SAMPLES = 200;
export const SHOPPING_LIST_OPEN_P95_BUDGET_MS = 1000;

const openSamples: ShoppingListOpenSample[] = [];

function nowMs(): number {
  if (typeof globalThis.performance?.now === 'function') {
    return globalThis.performance.now();
  }

  return Date.now();
}

function toPositiveNumber(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function pushSample(sample: ShoppingListOpenSample): void {
  openSamples.push(sample);
  if (openSamples.length > MAX_SAMPLES) {
    openSamples.splice(0, openSamples.length - MAX_SAMPLES);
  }
}

export function startShoppingListOpenMeasurement(): number {
  return nowMs();
}

export function recordShoppingListVisibleMeasurement(
  startedAtPerfMs: number
): ShoppingListOpenSample {
  const sample: ShoppingListOpenSample = {
    durationMs: toPositiveNumber(nowMs() - startedAtPerfMs),
    measuredAtMs: Date.now(),
  };

  pushSample(sample);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const summary = getShoppingListOpenSummary();
    console.info(
      `[shopping-list-perf] open->visible ${sample.durationMs.toFixed(1)}ms (budget p95<=${SHOPPING_LIST_OPEN_P95_BUDGET_MS}ms) (samples=${summary.count}, p95=${summary.p95Ms?.toFixed(1) ?? 'n/a'}ms)`
    );
  }

  return sample;
}

export function getShoppingListOpenSummary(
  options?: ShoppingListOpenSummaryOptions
): ShoppingListOpenSummary {
  const filtered = openSamples.filter((sample) => {
    if (
      typeof options?.sinceMeasuredAtMs === 'number' &&
      Number.isFinite(options.sinceMeasuredAtMs) &&
      sample.measuredAtMs < options.sinceMeasuredAtMs
    ) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    return { count: 0, p95Ms: null, maxMs: null, latestSample: null };
  }

  const durations = filtered
    .map((sample) => sample.durationMs)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);

  return {
    count: filtered.length,
    p95Ms: durations[p95Index] ?? null,
    maxMs: durations[durations.length - 1] ?? null,
    latestSample: filtered[filtered.length - 1] ?? null,
  };
}

export function getShoppingListOpenSamples(
  options?: ShoppingListOpenSummaryOptions
): ShoppingListOpenSample[] {
  return openSamples
    .filter((sample) => {
      if (
        typeof options?.sinceMeasuredAtMs === 'number' &&
        Number.isFinite(options.sinceMeasuredAtMs) &&
        sample.measuredAtMs < options.sinceMeasuredAtMs
      ) {
        return false;
      }

      return true;
    })
    .map((sample) => ({ ...sample }));
}

export function __resetShoppingListOpenMeasurementsForTests(): void {
  openSamples.length = 0;
}
