import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  getCameraPermissionSnapshot,
  requestCameraPermissionSnapshot,
  type CameraPermissionSnapshot,
} from '../features/scan/permissions/camera-permission';
import {
  runDevHapticsSmoke,
  type DevHapticsSmokeResult,
} from '../features/device/haptics/dev-haptics-smoke';

function prettyPermission(permission: CameraPermissionSnapshot | null) {
  if (!permission) {
    return 'Not checked yet';
  }

  return JSON.stringify(permission, null, 2);
}

export function DeviceSmokeScreen() {
  const [permission, setPermission] = useState<CameraPermissionSnapshot | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hapticsResult, setHapticsResult] = useState<DevHapticsSmokeResult | null>(null);
  const [busyAction, setBusyAction] = useState<'check-camera' | 'request-camera' | 'haptics' | null>(null);

  async function runCameraCheck() {
    setPermissionError(null);
    setBusyAction('check-camera');

    try {
      setPermission(await getCameraPermissionSnapshot());
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Unknown camera permission error');
    } finally {
      setBusyAction(null);
    }
  }

  async function runCameraRequest() {
    setPermissionError(null);
    setBusyAction('request-camera');

    try {
      setPermission(await requestCameraPermissionSnapshot());
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : 'Unknown camera permission request error');
    } finally {
      setBusyAction(null);
    }
  }

  async function runHaptics() {
    setBusyAction('haptics');

    try {
      setHapticsResult(await runDevHapticsSmoke());
    } finally {
      setBusyAction(null);
    }
  }

  const isBusy = busyAction !== null;
  const isWeb = Platform.OS === 'web';

  return (
    <>
      <Stack.Screen options={{ title: 'Device Smoke' }} />

      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
        <Text style={styles.title}>Device Capability Smoke</Text>
        <Text style={styles.subtitle}>
          Temporary dev-only screen for Story 1.3 camera permission and haptics readiness checks.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Environment</Text>
          <Text style={styles.mono}>Platform: {Platform.OS}</Text>
          <Text style={styles.mono}>Dev mode: {String(__DEV__)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Camera Permission</Text>
          <Text style={styles.help}>
            Uses the reusable scan permission helper. Safe on web via platform-specific module fallback.
          </Text>
          {isWeb ? (
            <Text style={styles.help}>
              Camera permission smoke actions are disabled on web. Validate camera permissions on iOS/Android only.
            </Text>
          ) : null}
          <View style={styles.row}>
            <ActionButton
              label={isWeb ? 'Check Camera Permission (Web Unsupported)' : 'Check Camera Permission'}
              onPress={runCameraCheck}
              disabled={isBusy || isWeb}
              busy={busyAction === 'check-camera'}
            />
            <ActionButton
              label={isWeb ? 'Request Camera Permission (Web Unsupported)' : 'Request Camera Permission'}
              onPress={runCameraRequest}
              disabled={isBusy || isWeb}
              busy={busyAction === 'request-camera'}
            />
          </View>
          {permissionError ? <Text style={styles.error}>Error: {permissionError}</Text> : null}
          <Text style={styles.mono}>{prettyPermission(permission)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Haptics Smoke</Text>
          <Text style={styles.help}>
            Runs selection feedback, then platform-specific success feedback and handles failures cleanly.
          </Text>
          <ActionButton
            label="Run Haptics Smoke"
            onPress={runHaptics}
            disabled={isBusy}
            busy={busyAction === 'haptics'}
          />
          <Text style={styles.mono}>
            {hapticsResult ? JSON.stringify(hapticsResult, null, 2) : 'Not run yet'}
          </Text>
          <Text style={styles.help}>
            Torch support comes from `expo-camera` camera view props and will be exercised in Story 2.4.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled: boolean;
  busy: boolean;
};

function ActionButton({ label, onPress, disabled, busy }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#444',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  help: {
    color: '#555',
    lineHeight: 18,
  },
  row: {
    gap: 10,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: '#b00020',
    fontWeight: '500',
  },
  mono: {
    backgroundColor: '#fff',
    borderRadius: 8,
    color: '#222',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    padding: 10,
  },
});
