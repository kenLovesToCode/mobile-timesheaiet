type PendingRefreshMeasurement = {
  barcode: string;
  startedAtMs: number;
  startedAtPerfMs: number;
};

type RefreshMeasurementSample = {
  barcode: string;
  startedAtMs: number;
  durationMs: number;
  measuredAtMs: number;
};

type RefreshMeasurementSummary = {
  count: number;
  p95Ms: number | null;
  maxMs: number | null;
  latestSample: RefreshMeasurementSample | null;
};

type RefreshMeasurementSummaryOptions = {
  barcode?: string;
  sinceMeasuredAtMs?: number;
};

const pendingByBarcode = new Map<string, PendingRefreshMeasurement[]>();
const measurementSamples: RefreshMeasurementSample[] = [];
const MAX_SAMPLES = 200;
const MAX_PENDING_PER_BARCODE = 20;
const MAX_PENDING_TOTAL = 200;
const PENDING_TTL_MS = 5 * 60 * 1000;

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

function prunePendingMeasurements(now = Date.now()): void {
  const cutoffMs = now - PENDING_TTL_MS;
  let totalPending = 0;

  for (const [barcode, queue] of pendingByBarcode.entries()) {
    const filtered = queue.filter((entry) => entry.startedAtMs >= cutoffMs);

    if (filtered.length > MAX_PENDING_PER_BARCODE) {
      filtered.splice(0, filtered.length - MAX_PENDING_PER_BARCODE);
    }

    if (filtered.length === 0) {
      pendingByBarcode.delete(barcode);
      continue;
    }

    pendingByBarcode.set(barcode, filtered);
    totalPending += filtered.length;
  }

  if (totalPending <= MAX_PENDING_TOTAL) {
    return;
  }

  const allEntries: { barcode: string; startedAtMs: number }[] = [];
  for (const [barcode, queue] of pendingByBarcode.entries()) {
    for (const entry of queue) {
      allEntries.push({ barcode, startedAtMs: entry.startedAtMs });
    }
  }

  allEntries.sort((a, b) => a.startedAtMs - b.startedAtMs);
  const toRemove = totalPending - MAX_PENDING_TOTAL;
  const removeCounts = new Map<string, number>();

  for (let i = 0; i < toRemove && i < allEntries.length; i += 1) {
    const entry = allEntries[i];
    removeCounts.set(entry.barcode, (removeCounts.get(entry.barcode) ?? 0) + 1);
  }

  for (const [barcode, queue] of pendingByBarcode.entries()) {
    const removeCount = removeCounts.get(barcode) ?? 0;
    if (removeCount <= 0) {
      continue;
    }

    queue.splice(0, Math.min(removeCount, queue.length));

    if (queue.length === 0) {
      pendingByBarcode.delete(barcode);
    }
  }
}

export function markPendingResultsRefreshMeasurement(barcode: string): void {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) {
    return;
  }

  prunePendingMeasurements();
  const queue = pendingByBarcode.get(normalizedBarcode) ?? [];
  queue.push({
    barcode: normalizedBarcode,
    startedAtMs: Date.now(),
    startedAtPerfMs: nowMs(),
  });
  pendingByBarcode.set(normalizedBarcode, queue);
}

export function recordCompletedResultsRefreshMeasurement(
  barcode: string
): RefreshMeasurementSample | null {
  const normalizedBarcode = barcode.trim();
  prunePendingMeasurements();
  const queue = pendingByBarcode.get(normalizedBarcode);
  const pending = queue?.pop();

  if (!pending) {
    return null;
  }

  if (queue && queue.length === 0) {
    pendingByBarcode.delete(normalizedBarcode);
  }

  const sample: RefreshMeasurementSample = {
    barcode: normalizedBarcode,
    startedAtMs: pending.startedAtMs,
    durationMs: toPositiveNumber(nowMs() - pending.startedAtPerfMs),
    measuredAtMs: Date.now(),
  };

  measurementSamples.push(sample);

  if (measurementSamples.length > MAX_SAMPLES) {
    measurementSamples.splice(0, measurementSamples.length - MAX_SAMPLES);
  }

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const summary = getResultsRefreshMeasurementSummary({
      barcode: normalizedBarcode,
      sinceMeasuredAtMs: pending.startedAtMs,
    });
    console.info(
      `[results-perf] save->refresh ${sample.durationMs.toFixed(1)}ms (fetch-only) (samples=${summary.count}, p95=${summary.p95Ms?.toFixed(1) ?? 'n/a'}ms)`
    );
  }

  return sample;
}

export function getResultsRefreshMeasurementSummary(
  options?: RefreshMeasurementSummaryOptions
): RefreshMeasurementSummary {
  const normalizedBarcode = options?.barcode?.trim();
  const filteredSamples = measurementSamples.filter((sample) => {
    if (normalizedBarcode && sample.barcode !== normalizedBarcode) {
      return false;
    }

    if (
      typeof options?.sinceMeasuredAtMs === 'number' &&
      Number.isFinite(options.sinceMeasuredAtMs) &&
      sample.measuredAtMs < options.sinceMeasuredAtMs
    ) {
      return false;
    }

    return true;
  });

  if (filteredSamples.length === 0) {
    return {
      count: 0,
      p95Ms: null,
      maxMs: null,
      latestSample: null,
    };
  }

  const durations = filteredSamples
    .map((sample) => sample.durationMs)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const p95Index = Math.max(0, Math.ceil(durations.length * 0.95) - 1);
  const latestSample = filteredSamples[filteredSamples.length - 1] ?? null;

  return {
    count: filteredSamples.length,
    p95Ms: durations[p95Index] ?? null,
    maxMs: durations[durations.length - 1] ?? null,
    latestSample,
  };
}

export function __resetResultsRefreshMeasurementsForTests(): void {
  pendingByBarcode.clear();
  measurementSamples.length = 0;
}
