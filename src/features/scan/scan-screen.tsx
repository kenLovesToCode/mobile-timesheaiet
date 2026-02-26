import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import type { BarcodeScanningResult } from 'expo-camera';
import { useTheme } from 'tamagui';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Surface } from '../../components/ui/surface';
import { Text } from '../../components/ui/text';
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
  discardPendingScanToResults,
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
  const scanReadyStartRef = useRef<number | null>(null);

  const loadGateState = useCallback(async () => {
    setGateState({ status: 'loading' });

    try {
      const activeStoreCount = await getActiveStoreCount();

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
      setPermissionState(mapPermissionSnapshot(snapshot));
    } catch (error) {
      console.error('[scan] Failed to load camera permission status', error);
      setPermissionState({ status: 'error' });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setPermissionState({ status: 'loading' });

    try {
      const snapshot = await requestCameraPermissionSnapshot();
      setPermissionState(mapPermissionSnapshot(snapshot));
    } catch (error) {
      console.error('[scan] Failed to request camera permission', error);
      setPermissionState({ status: 'error' });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      void loadGateState();
      void loadPermissionState();

      return () => {
        setIsFocused(false);
        setCameraReady(false);
        scanReadyStartRef.current = null;
      };
    }, [loadGateState, loadPermissionState])
  );

  const canMountCamera =
    isFocused && gateState.status === 'ready' && permissionState.status === 'ready';

  useEffect(() => {
    if (!canMountCamera) {
      setCameraReady(false);
      return;
    }

    if (scanReadyStartRef.current == null) {
      scanReadyStartRef.current = startScanReadyMeasurement();
    }
  }, [canMountCamera]);

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
      void triggerScanHaptics();
      router.push({
        pathname: '/results',
        params: { barcode, source: 'scan' },
      });
    },
    [router]
  );

  const manualEntryBarcode = useMemo(
    () => normalizeBarcodeValue(manualEntryValue),
    [manualEntryValue]
  );

  const handleManualEntrySubmit = useCallback(() => {
    if (!manualEntryBarcode) {
      return;
    }

    discardPendingScanToResults(manualEntryBarcode);
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
                  <Text variant="body" tone="danger">
                    Camera access is denied
                  </Text>
                  <Text variant="footnote" tone="secondary">
                    You can enter a barcode manually below to continue.
                  </Text>
                  <Input
                    label="Manual barcode"
                    value={manualEntryValue}
                    onChangeText={setManualEntryValue}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    helperText={
                      manualEntryValue.length > 0 && !manualEntryBarcode
                        ? 'Enter a UPC/EAN barcode (8, 12, or 13 digits).'
                        : 'Enter the barcode printed below the lines.'
                    }
                    testID="scan-manual-entry-input"
                  />
                  <Button
                    variant="secondary"
                    accessibilityLabel="View results from manual entry"
                    accessibilityState={{ disabled: !manualEntryBarcode }}
                    disabled={!manualEntryBarcode}
                    onPress={handleManualEntrySubmit}
                    testID="scan-manual-entry-submit"
                  >
                    View Results
                  </Button>
                </View>
              ) : null}

              {permissionState.status === 'unavailable' ? (
                <View style={styles.stack}>
                  <Text variant="body" tone="danger">
                    Camera is unavailable on this device
                  </Text>
                  <Input
                    label="Manual barcode"
                    value={manualEntryValue}
                    onChangeText={setManualEntryValue}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    helperText={
                      manualEntryValue.length > 0 && !manualEntryBarcode
                        ? 'Enter a UPC/EAN barcode (8, 12, or 13 digits).'
                        : 'Enter the barcode printed below the lines.'
                    }
                    testID="scan-manual-entry-input"
                  />
                  <Button
                    variant="secondary"
                    accessibilityLabel="View results from manual entry"
                    accessibilityState={{ disabled: !manualEntryBarcode }}
                    disabled={!manualEntryBarcode}
                    onPress={handleManualEntrySubmit}
                    testID="scan-manual-entry-submit"
                  >
                    View Results
                  </Button>
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
});
