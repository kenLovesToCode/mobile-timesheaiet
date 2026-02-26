type ScanReadySample = {
  durationMs: number;
  measuredAtMs: number;
};

type PendingScanToResultsMeasurement = {
  barcode: string;
  startedAtMs: number;
  startedAtPerfMs: number;
};

type ScanToResultsSample = {
  barcode: string;
  durationMs: number;
  measuredAtMs: number;
};

type ScanPerformanceSummary = {
  count: number;
  p95Ms: number | null;
  maxMs: number | null;
  latestSample: ScanReadySample | ScanToResultsSample | null;
};

type ScanPerformanceSummaryOptions = {
  sinceMeasuredAtMs?: number;
};

const scanReadySamples: ScanReadySample[] = [];
const scanToResultsSamples: ScanToResultsSample[] = [];
const pendingScanToResults = new Map<string, PendingScanToResultsMeasurement[]>();

const MAX_SAMPLES = 200;
const MAX_PENDING_TOTAL = 200;
const MAX_PENDING_PER_BARCODE = 20;
const PENDING_TTL_MS = 5 * 60 * 1000;

const SCAN_READY_WARM_BUDGET_MS = 2000;
const SCAN_READY_COLD_BUDGET_MS = 4000;
const SCAN_TO_RESULTS_BUDGET_MS = 3000;

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

function pushSample<T>(samples: T[], sample: T): void {
  samples.push(sample);

  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

function summarizeSamples<T extends { durationMs: number; measuredAtMs: number }>(
  samples: T[],
  options?: ScanPerformanceSummaryOptions
): ScanPerformanceSummary {
  const filtered = samples.filter((sample) => {
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

function prunePendingMeasurements(now = Date.now()): void {
  const cutoffMs = now - PENDING_TTL_MS;
  let totalPending = 0;

  for (const [barcode, queue] of pendingScanToResults.entries()) {
    const filtered = queue.filter((entry) => entry.startedAtMs >= cutoffMs);

    if (filtered.length > MAX_PENDING_PER_BARCODE) {
      filtered.splice(0, filtered.length - MAX_PENDING_PER_BARCODE);
    }

    if (filtered.length === 0) {
      pendingScanToResults.delete(barcode);
      continue;
    }

    pendingScanToResults.set(barcode, filtered);
    totalPending += filtered.length;
  }

  if (totalPending <= MAX_PENDING_TOTAL) {
    return;
  }

  const allEntries: { barcode: string; startedAtMs: number }[] = [];
  for (const [barcode, queue] of pendingScanToResults.entries()) {
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

  for (const [barcode, queue] of pendingScanToResults.entries()) {
    const removeCount = removeCounts.get(barcode) ?? 0;
    if (removeCount <= 0) {
      continue;
    }

    queue.splice(0, Math.min(removeCount, queue.length));

    if (queue.length === 0) {
      pendingScanToResults.delete(barcode);
    }
  }
}

export function startScanReadyMeasurement(): number {
  return nowMs();
}

export function recordScanReadyMeasurement(startedAtPerfMs: number): ScanReadySample {
  const durationMs = toPositiveNumber(nowMs() - startedAtPerfMs);
  const sample: ScanReadySample = {
    durationMs,
    measuredAtMs: Date.now(),
  };

  pushSample(scanReadySamples, sample);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const summary = summarizeSamples(scanReadySamples);
    const budgetStatus =
      durationMs <= SCAN_READY_WARM_BUDGET_MS
        ? 'warm'
        : durationMs <= SCAN_READY_COLD_BUDGET_MS
          ? 'cold'
          : 'over';
    console.info(
      `[scan-perf] scan-ready ${durationMs.toFixed(1)}ms (budget warm<=${SCAN_READY_WARM_BUDGET_MS}ms cold<=${SCAN_READY_COLD_BUDGET_MS}ms, status=${budgetStatus}) (samples=${summary.count}, p95=${summary.p95Ms?.toFixed(1) ?? 'n/a'}ms)`
    );
  }

  return sample;
}

export function markPendingScanToResults(barcode: string): void {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) {
    return;
  }

  prunePendingMeasurements();
  const queue = pendingScanToResults.get(normalizedBarcode) ?? [];
  queue.push({
    barcode: normalizedBarcode,
    startedAtMs: Date.now(),
    startedAtPerfMs: nowMs(),
  });
  pendingScanToResults.set(normalizedBarcode, queue);
}

export function discardPendingScanToResults(barcode: string): void {
  const normalizedBarcode = barcode.trim();
  if (!normalizedBarcode) {
    return;
  }

  pendingScanToResults.delete(normalizedBarcode);
}

export function recordCompletedScanToResults(barcode: string): ScanToResultsSample | null {
  const normalizedBarcode = barcode.trim();
  prunePendingMeasurements();
  const queue = pendingScanToResults.get(normalizedBarcode);
  const pending = queue?.pop();

  if (!pending) {
    return null;
  }

  if (queue && queue.length === 0) {
    pendingScanToResults.delete(normalizedBarcode);
  }

  const sample: ScanToResultsSample = {
    barcode: normalizedBarcode,
    durationMs: toPositiveNumber(nowMs() - pending.startedAtPerfMs),
    measuredAtMs: Date.now(),
  };

  pushSample(scanToResultsSamples, sample);

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    const summary = summarizeSamples(scanToResultsSamples);
    console.info(
      `[scan-perf] scan->results ${sample.durationMs.toFixed(1)}ms (budget p95<=${SCAN_TO_RESULTS_BUDGET_MS}ms) (samples=${summary.count}, p95=${summary.p95Ms?.toFixed(1) ?? 'n/a'}ms)`
    );
  }

  return sample;
}

export function getScanReadySummary(options?: ScanPerformanceSummaryOptions): ScanPerformanceSummary {
  return summarizeSamples(scanReadySamples, options);
}

export function getScanToResultsSummary(
  options?: ScanPerformanceSummaryOptions
): ScanPerformanceSummary {
  return summarizeSamples(scanToResultsSamples, options);
}

export function __resetScanMeasurementsForTests(): void {
  scanReadySamples.length = 0;
  scanToResultsSamples.length = 0;
  pendingScanToResults.clear();
}
