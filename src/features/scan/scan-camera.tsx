import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { CameraView, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { isValidBarcodeValue } from './scan-barcode';

const scanBarcodeTypes: BarcodeType[] = ['upc_a', 'upc_e', 'ean13', 'ean8'];

type ScanCameraProps = {
  isActive: boolean;
  enableTorch: boolean;
  onBarcodeScanned: (result: BarcodeScanningResult) => void;
  onCameraReady?: () => void;
};

export function ScanCamera({
  isActive,
  enableTorch,
  onBarcodeScanned,
  onCameraReady,
}: ScanCameraProps) {
  const hasScannedRef = useRef(false);
  const barcodeTypes = useMemo(() => scanBarcodeTypes, []);

  useEffect(() => {
    if (!isActive) {
      hasScannedRef.current = false;
    }
  }, [isActive]);

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (!isActive || hasScannedRef.current) {
        return;
      }

      if (!isValidBarcodeValue(result?.data)) {
        return;
      }

      hasScannedRef.current = true;
      onBarcodeScanned(result);
    },
    [isActive, onBarcodeScanned]
  );

  if (!isActive) {
    return null;
  }

  return (
    <CameraView
      style={styles.camera}
      testID="scan-camera-view"
      onCameraReady={onCameraReady}
      onBarcodeScanned={handleBarcodeScanned}
      enableTorch={enableTorch}
      barcodeScannerSettings={{ barcodeTypes }}
    />
  );
}

const styles = StyleSheet.create({
  camera: {
    height: 320,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
});
