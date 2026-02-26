import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { BarcodeScanningResult } from 'expo-camera';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ListRow } from '../../components/ui/list-row';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
import {
  listRecentScans,
  recordRecentScan,
  type RecentScanRecord,
} from '../../db/repositories/recent-scans-repository';
import { getActiveStoreCount } from '../../db/repositories/store-repository';
import { spacing } from '../../theme/tokens';
import {
  getCameraPermissionSnapshot,
  requestCameraPermissionSnapshot,
  type CameraPermissionSnapshot,
} from './permissions/camera-permission';
import { ScanCamera } from './scan-camera';
import { triggerScanHaptics } from './scan-haptics';
import {
  markPendingScanToResults,
  recordScanReadyMeasurement,
  startScanReadyMeasurement,
} from './scan-performance';
import { normalizeBarcodeValue } from './scan-barcode';

type ScanGateState =
  | { status: 'loading' }
  | { status: 'blocked' }
  | { status: 'ready'; activeStoreCount: number }
  | { status: 'error' };

type CameraPermissionState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: CameraPermissionSnapshot }
  | { status: 'request'; snapshot: CameraPermissionSnapshot }
  | { status: 'denied'; snapshot: CameraPermissionSnapshot }
  | { status: 'unavailable'; snapshot: CameraPermissionSnapshot }
  | { status: 'error' };

type RecentScansState = 'idle' | 'loading' | 'ready' | 'error';

const FALLBACK_DELAY_MS = 5000;
const RECENT_SCANS_LIMIT = 5;

function mapPermissionSnapshot(snapshot: CameraPermissionSnapshot): CameraPermissionState {
  if (!snapshot.isAvailable) {
    return { status: 'unavailable', snapshot };
  }

  if (snapshot.granted) {
    return { status: 'ready', snapshot };
  }

  if (snapshot.canAskAgain) {
    return { status: 'request', snapshot };
  }

  return { status: 'denied', snapshot };
}

export function ScanFeatureScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [gateState, setGateState] = useState<ScanGateState>({ status: 'loading' });
  const [permissionState, setPermissionState] = useState<CameraPermissionState>({
    status: 'loading',
  });
  const [isFocused, setIsFocused] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [manualEntryValue, setManualEntryValue] = useState('');
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [recentScansState, setRecentScansState] = useState<RecentScansState>('idle');
  const [recentScans, setRecentScans] = useState<RecentScanRecord[]>([]);
  const isActiveRef = useRef(false);
  const scanReadyStartRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentScansRequestIdRef = useRef(0);
  const permissionFallbackActive =
    permissionState.status === 'denied' || permissionState.status === 'unavailable';

  const loadGateState = useCallback(async () => {
    setGateState({ status: 'loading' });

    try {
      const activeStoreCount = await getActiveStoreCount();

      if (!isActiveRef.current) {
        return;
      }

      if (activeStoreCount < 1) {
        setGateState({ status: 'blocked' });
        return;
      }

      setGateState({ status: 'ready', activeStoreCount });
    } catch (error) {
      console.error('[scan] Failed to load active store gate', error);
      setGateState({ status: 'error' });
    }
  }, []);

  const loadPermissionState = useCallback(async () => {
    setPermissionState({ status: 'loading' });

    try {
      const snapshot = await getCameraPermissionSnapshot();
      if (!isActiveRef.current) {
        return;
      }
      setPermissionState(mapPermissionSnapshot(snapshot));
    } catch (error) {
      console.error('[scan] Failed to load camera permission status', error);
      if (!isActiveRef.current) {
        return;
      }
      setPermissionState({ status: 'error' });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setPermissionState({ status: 'loading' });

    try {
      const snapshot = await requestCameraPermissionSnapshot();
      if (!isActiveRef.current) {
        return;
      }
      setPermissionState(mapPermissionSnapshot(snapshot));
    } catch (error) {
      console.error('[scan] Failed to request camera permission', error);
      if (!isActiveRef.current) {
        return;
      }
      setPermissionState({ status: 'error' });
    }
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current != null) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  const resetFallbackState = useCallback(() => {
    clearFallbackTimer();
    setFallbackVisible(false);
    setManualEntryOpen(false);
  }, [clearFallbackTimer]);

  const loadRecentScans = useCallback(async () => {
    const requestId = recentScansRequestIdRef.current + 1;
    recentScansRequestIdRef.current = requestId;
    setRecentScansState('loading');

    try {
      const scans = await listRecentScans(RECENT_SCANS_LIMIT);
      if (!isActiveRef.current || requestId !== recentScansRequestIdRef.current) {
        return;
      }
      setRecentScans(scans);
      setRecentScansState('ready');
    } catch (error) {
      if (!isActiveRef.current || requestId !== recentScansRequestIdRef.current) {
        return;
      }
      console.error('[scan] Failed to load recent scans', error);
      setRecentScans([]);
      setRecentScansState('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      isActiveRef.current = true;
      setManualEntryOpen(false);
      setManualEntryValue('');
      setFallbackVisible(false);
      setRecentScansState('idle');
      setRecentScans([]);
      setIsFocused(true);
      void loadGateState();
      void loadPermissionState();

      return () => {
        isActiveRef.current = false;
        setIsFocused(false);
        setCameraReady(false);
        setTorchEnabled(false);
        setManualEntryValue('');
        scanReadyStartRef.current = null;
        resetFallbackState();
      };
    }, [loadGateState, loadPermissionState, resetFallbackState])
  );

  const canMountCamera =
    isFocused && gateState.status === 'ready' && permissionState.status === 'ready';

  useEffect(() => {
    if (!canMountCamera) {
      setCameraReady(false);
      if (!permissionFallbackActive) {
        resetFallbackState();
      }
      return;
    }

    if (scanReadyStartRef.current == null) {
      scanReadyStartRef.current = startScanReadyMeasurement();
    }
  }, [canMountCamera, permissionFallbackActive, resetFallbackState]);

  useEffect(() => {
    if (!isFocused || !canMountCamera || !cameraReady) {
      if (!permissionFallbackActive) {
        resetFallbackState();
      }
      return;
    }

    if (fallbackVisible || fallbackTimerRef.current != null) {
      return;
    }

    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      setFallbackVisible(true);
      void loadRecentScans();
    }, FALLBACK_DELAY_MS);

    return () => {
      clearFallbackTimer();
    };
  }, [
    cameraReady,
    canMountCamera,
    clearFallbackTimer,
    fallbackVisible,
    isFocused,
    loadRecentScans,
    permissionFallbackActive,
    resetFallbackState,
  ]);

  useEffect(() => {
    if (!isFocused || gateState.status !== 'ready' || !permissionFallbackActive) {
      return;
    }

    setFallbackVisible(true);
    void loadRecentScans();
  }, [gateState.status, isFocused, loadRecentScans, permissionFallbackActive]);

  const storeSummary = useMemo(() => {
    if (gateState.status !== 'ready') {
      return null;
    }

    return `${gateState.activeStoreCount} active store${
      gateState.activeStoreCount === 1 ? '' : 's'
    }`;
  }, [gateState]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      const barcode = normalizeBarcodeValue(result?.data);

      if (!barcode) {
        return;
      }

      markPendingScanToResults(barcode);
      resetFallbackState();
      setManualEntryValue('');
      const recordPromise = recordRecentScan({ barcode, source: 'scan' });
      if (recordPromise && typeof recordPromise.catch === 'function') {
        void recordPromise.catch((error) => {
          console.error('[scan] Failed to record recent scan', error);
        });
      }
      void triggerScanHaptics();
      router.push({
        pathname: '/results',
        params: { barcode, source: 'scan' },
      });
    },
    [resetFallbackState, router]
  );

  const manualEntryBarcode = useMemo(
    () => normalizeBarcodeValue(manualEntryValue),
    [manualEntryValue]
  );

  const handleManualEntrySubmit = useCallback(() => {
    if (!manualEntryBarcode) {
      return;
    }

    setManualEntryOpen(false);
    setFallbackVisible(false);
    setManualEntryValue('');
    router.push({
      pathname: '/results',
      params: { barcode: manualEntryBarcode },
    });
  }, [manualEntryBarcode, router]);

  const handleCameraReady = useCallback(() => {
    setCameraReady(true);
    if (scanReadyStartRef.current != null) {
      recordScanReadyMeasurement(scanReadyStartRef.current);
      scanReadyStartRef.current = null;
    }
  }, []);

  const recentScanSubtitle = useCallback((scannedAt: number) => {
    const date = new Date(scannedAt);
    return `Scanned ${date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }, []);

  const handleRecentScanPress = useCallback(
    (barcode: string) => {
      setManualEntryOpen(false);
      setFallbackVisible(false);
      setManualEntryValue('');
      router.push({
        pathname: '/results',
        params: { barcode },
      });
    },
    [router]
  );

  const shouldShowFallback = fallbackVisible || permissionFallbackActive;
  const fallbackCopy = useMemo(() => {
    if (permissionState.status === 'denied') {
      return {
        title: 'Use manual entry or recent scans',
        description:
          'Camera access is denied right now. You can still look up items below.',
      };
    }

    if (permissionState.status === 'unavailable') {
      return {
        title: 'Use manual entry or recent scans',
        description:
          'Camera access is unavailable on this device. You can still look up items below.',
      };
    }

    return {
      title: 'Need a quick fallback?',
      description: 'You can keep scanning, or choose a fast manual option below.',
    };
  }, [permissionState.status]);

  const fallbackSurface = shouldShowFallback ? (
    <Surface variant="subtle" style={styles.fallbackShell}>
      <Text variant="headline">{fallbackCopy.title}</Text>
      <Text variant="footnote" tone="secondary">
        {fallbackCopy.description}
      </Text>

      <View style={styles.fallbackActions}>
        <Button
          variant="secondary"
          accessibilityLabel="Enter barcode manually"
          onPress={() => setManualEntryOpen(true)}
          testID="scan-fallback-manual-entry"
        >
          Manual entry
        </Button>
      </View>

      {manualEntryOpen ? (
        <View style={styles.manualEntrySheet}>
          <Text variant="headline">Enter a barcode</Text>
          <Input
            label="Barcode"
            value={manualEntryValue}
            onChangeText={setManualEntryValue}
            autoCapitalize="none"
            keyboardType="number-pad"
            helperText={
              manualEntryValue.length > 0 && !manualEntryBarcode
                ? 'Enter a UPC/EAN barcode (8, 12, or 13 digits).'
                : 'Digits only, we will format it for you.'
            }
            testID="scan-fallback-manual-input"
          />
          <View style={styles.manualEntryActions}>
            <Button
              variant="secondary"
              accessibilityLabel="Cancel manual entry"
              onPress={() => setManualEntryOpen(false)}
              testID="scan-fallback-manual-cancel"
            >
              Cancel
            </Button>
            <Button
              accessibilityLabel="View results from manual entry"
              disabled={!manualEntryBarcode}
              onPress={handleManualEntrySubmit}
              testID="scan-fallback-manual-submit"
            >
              View Results
            </Button>
          </View>
        </View>
      ) : null}

      <View style={styles.recentScansHeader}>
        <Text variant="headline">Recent scans</Text>
        <Button
          variant="secondary"
          accessibilityLabel="Refresh recent scans"
          onPress={() => void loadRecentScans()}
          testID="scan-recent-scans-refresh"
        >
          Refresh
        </Button>
      </View>

      {recentScansState === 'loading' ? (
        <View style={styles.centerState}>
          <ActivityIndicator accessibilityRole="progressbar" />
          <Text variant="footnote" tone="secondary">
            Loading recent scans...
          </Text>
        </View>
      ) : null}

      {recentScansState === 'error' ? (
        <View style={styles.centerState}>
          <Text variant="footnote" tone="secondary">
            Recent scans are unavailable right now.
          </Text>
        </View>
      ) : null}

      {recentScansState === 'ready' && recentScans.length === 0 ? (
        <View style={styles.centerState} testID="scan-recent-scans-empty">
          <Text variant="body">No recent scans yet.</Text>
          <Text variant="footnote" tone="secondary">
            Scan something to see it here.
          </Text>
          <Button
            variant="secondary"
            accessibilityLabel="Enter a barcode manually"
            onPress={() => setManualEntryOpen(true)}
            testID="scan-recent-scans-empty-manual-entry"
          >
            Manual entry
          </Button>
        </View>
      ) : null}

      {recentScansState === 'ready' && recentScans.length > 0 ? (
        <View style={styles.recentScansList}>
          {recentScans.map((scan) => (
            <ListRow
              key={scan.id}
              title={scan.barcode}
              subtitle={recentScanSubtitle(scan.scannedAt)}
              stateLabel="Use"
              tone="secondary"
              onPress={() => handleRecentScanPress(scan.barcode)}
              testID={`scan-recent-scan-${scan.id}`}
            />
          ))}
        </View>
      ) : null}
    </Surface>
  ) : null;

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.background?.val }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.contentContainer}
      >
        <Surface>
          <Text variant="title">Scan</Text>
          <Text variant="footnote" tone="secondary" style={styles.sectionLead}>
            Camera scanning is now live with haptics and torch support.
          </Text>
        </Surface>

        <Surface variant="subtle" style={styles.stateCard}>
          {gateState.status === 'loading' ? (
            <View style={styles.centerState}>
              <ActivityIndicator accessibilityRole="progressbar" />
              <Text variant="footnote" tone="secondary">
                Checking active stores...
              </Text>
            </View>
          ) : null}

          {gateState.status === 'blocked' ? (
            <View style={styles.stack}>
              <Text variant="headline">Activate a store to start scanning</Text>
              <Text variant="body">
                Choose at least one active store so scan results stay relevant to where you shop.
              </Text>
              <Button
                accessibilityLabel="Manage stores"
                onPress={() => router.push('/stores')}
                testID="scan-gate-manage-stores-button"
              >
                Manage Stores
              </Button>
            </View>
          ) : null}

          {gateState.status === 'error' ? (
            <View style={styles.stack}>
              <Text variant="headline" tone="danger">
                Could not load scan readiness
              </Text>
              <Text variant="footnote" tone="secondary">
                Try again after returning to this screen.
              </Text>
              <Button
                variant="secondary"
                accessibilityLabel="Retry scan readiness check"
                onPress={() => void loadGateState()}
                testID="scan-gate-retry-button"
              >
                Retry
              </Button>
            </View>
          ) : null}

          {gateState.status === 'ready' ? (
            <View style={styles.stack}>
              <Text variant="headline">Scan is ready</Text>
              <Text variant="body">{storeSummary} configured for results.</Text>

              {permissionState.status === 'loading' ? (
                <View style={styles.centerState}>
                  <ActivityIndicator accessibilityRole="progressbar" />
                  <Text variant="footnote" tone="secondary">
                    Checking camera access...
                  </Text>
                </View>
              ) : null}

              {permissionState.status === 'request' ? (
                <View style={styles.stack}>
                  <Text variant="body">Camera access is needed to scan barcodes.</Text>
                  <Button
                    accessibilityLabel="Enable camera"
                    onPress={() => void requestPermission()}
                    testID="scan-permission-request-button"
                  >
                    Enable Camera
                  </Button>
                </View>
              ) : null}

              {permissionState.status === 'denied' ? (
                <View style={styles.stack}>
                  <Text variant="body">Camera access is denied.</Text>
                  {fallbackSurface}
                </View>
              ) : null}

              {permissionState.status === 'unavailable' ? (
                <View style={styles.stack}>
                  <Text variant="body">Camera is unavailable on this device.</Text>
                  {fallbackSurface}
                </View>
              ) : null}

              {permissionState.status === 'error' ? (
                <View style={styles.stack}>
                  <Text variant="body" tone="danger">
                    Camera status unavailable
                  </Text>
                  <Button
                    variant="secondary"
                    accessibilityLabel="Retry camera permission check"
                    onPress={() => void loadPermissionState()}
                    testID="scan-permission-retry-button"
                  >
                    Retry Camera Check
                  </Button>
                </View>
              ) : null}

              {permissionState.status === 'ready' ? (
                <View style={styles.stack}>
                  <View style={styles.cameraShell}>
                    {canMountCamera ? (
                      <ScanCamera
                        isActive={canMountCamera}
                        enableTorch={torchEnabled}
                        onBarcodeScanned={handleBarcodeScanned}
                        onCameraReady={handleCameraReady}
                      />
                    ) : (
                      <View
                        style={[
                          styles.cameraPlaceholder,
                          { borderColor: theme.borderColor?.val ?? '#cccccc' },
                        ]}
                      >
                        <Text variant="footnote" tone="secondary">
                          Camera paused while the screen is inactive.
                        </Text>
                      </View>
                    )}

                    {canMountCamera && !cameraReady ? (
                      <View style={styles.cameraOverlay}>
                        <ActivityIndicator accessibilityRole="progressbar" />
                        <Text variant="footnote" tone="secondary">
                          Starting camera...
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.controlsRow}>
                    <Button
                      variant={torchEnabled ? 'primary' : 'secondary'}
                      accessibilityLabel={
                        torchEnabled ? 'Turn torch off' : 'Turn torch on'
                      }
                      onPress={() => setTorchEnabled((prev) => !prev)}
                      testID="scan-torch-toggle"
                    >
                      {torchEnabled ? 'Torch On' : 'Torch Off'}
                    </Button>
                    <Text variant="footnote" tone="secondary">
                      Keep the barcode centered for the fastest scan.
                    </Text>
                  </View>

                  {fallbackVisible ? (
                    fallbackSurface
                  ) : null}
                </View>
              ) : null}
            </View>
          ) : null}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  stateCard: {
    marginTop: spacing.md,
  },
  sectionLead: {
    marginTop: spacing.xs,
  },
  centerState: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  stack: {
    gap: spacing.sm,
  },
  cameraShell: {
    position: 'relative',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 16,
  },
  cameraPlaceholder: {
    height: 320,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  controlsRow: {
    gap: spacing.sm,
  },
  fallbackShell: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  fallbackActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  manualEntrySheet: {
    gap: spacing.sm,
  },
  manualEntryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  recentScansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recentScansList: {
    gap: spacing.sm,
  },
});
